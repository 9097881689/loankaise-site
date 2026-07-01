#!/usr/bin/env ruby
require 'cgi'
require 'json'
require 'fileutils'
require 'date'

ROOT = File.expand_path('..', __dir__)
SITE = File.join(ROOT, 'site')

def sections(body)
  result = {}
  body.scan(/^###\s+(.+?)\r?\n+(.*?)(?=^###\s+|\z)/m).each do |label, value|
    clean = value.strip
    clean = '' if clean == '_No response_'
    result[label.strip] = clean
  end
  result
end

def inline_markdown(text)
  safe = CGI.escapeHTML(text)
  safe = safe.gsub(/!\[([^\]]*)\]\((https?:\/\/[^)\s]+)\)/, '<img src="\\2" alt="\\1" loading="lazy">')
  safe = safe.gsub(/\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/, '<a href="\\2" rel="noopener">\\1</a>')
  safe = safe.gsub(/\*\*(.+?)\*\*/, '<strong>\\1</strong>')
  safe
end

def markdown_to_html(markdown)
  lines = markdown.gsub("\r\n", "\n").lines.map(&:chomp)
  html = []
  paragraph = []
  in_list = false
  flush_paragraph = lambda do
    unless paragraph.empty?
      html << "<p>#{inline_markdown(paragraph.join(' '))}</p>"
      paragraph.clear
    end
  end
  lines.each do |line|
    if line.start_with?('### ')
      flush_paragraph.call
      html << '</ul>' if in_list
      in_list = false
      html << "<h3>#{inline_markdown(line.delete_prefix('### ').strip)}</h3>"
    elsif line.start_with?('## ')
      flush_paragraph.call
      html << '</ul>' if in_list
      in_list = false
      html << "<h2>#{inline_markdown(line.delete_prefix('## ').strip)}</h2>"
    elsif line.match?(/^[-*]\s+/)
      flush_paragraph.call
      unless in_list
        html << '<ul>'
        in_list = true
      end
      html << "<li>#{inline_markdown(line.sub(/^[-*]\s+/, ''))}</li>"
    elsif line.strip.empty?
      flush_paragraph.call
      if in_list
        html << '</ul>'
        in_list = false
      end
    else
      paragraph << line.strip
    end
  end
  flush_paragraph.call
  html << '</ul>' if in_list
  html.join("\n")
end

def ad_unit(slot)
  %Q(<div class="ad-slot"><span class="ad-label">ADVERTISEMENT</span><ins class="adsbygoogle" style="display:block" data-ad-client="ca-pub-4298058382758528" data-ad-slot="#{slot}" data-ad-format="auto" data-full-width-responsive="true"></ins><script>(adsbygoogle=window.adsbygoogle||[]).push({});</script></div>)
end

def monetize(content)
  count = content.scan(%r{</p>}i).length
  return content + ad_unit('9974716573') if count < 6
  points = [3, [(count * 0.60).round, 4].max].uniq
  slots = { points[0] => '9974716573', points[1] => '7602979116' }
  seen = 0
  content.gsub(%r{</p>}i) do |tag|
    seen += 1
    tag + (slots[seen] ? ad_unit(slots[seen]) : '')
  end
end

def renumber(rows)
  number = 0
  rows.gsub(/<span class="post-num">\d+<\/span>/) do
    number += 1
    %Q(<span class="post-num">#{number}</span>)
  end
end

def add_to_listing(file, href, title, limit = nil)
  html = File.read(file)
  match = html.match(/(<div class="post-list">)(.*?)(<\/div><div class="empty">)/m)
  raise "Post list not found in #{file}" unless match
  rows = match[2].scan(/<a class="post-row".*?<\/a>/m)
  rows.reject! { |row| row.include?(%Q(href="#{href}")) }
  new_row = %Q(<a class="post-row" data-search="#{CGI.escapeHTML(title)}" href="#{href}"><span class="post-num">1</span><h3>#{CGI.escapeHTML(title)}</h3></a>)
  rows.unshift(new_row)
  rows = rows.first(limit) if limit
  replacement = match[1] + renumber(rows.join) + match[3]
  File.write(file, html.sub(match[0], replacement))
end

fields = sections(ENV.fetch('ISSUE_BODY'))
title = fields.fetch('Post Title').strip
slug = fields.fetch('URL Slug').strip.downcase
category = fields.fetch('Category').strip
meta_title = fields.fetch('SEO Meta Title').strip
description = fields.fetch('SEO Meta Description').strip
keyword = fields.fetch('Focus Keyword').strip
image = fields.fetch('Featured Image URL', '').strip
body = fields.fetch('Article Body').strip

abort 'Invalid slug. Use lowercase English letters, numbers and hyphens only.' unless slug.match?(/\A[a-z0-9]+(?:-[a-z0-9]+)*\z/)
abort 'Article body is too short.' if body.length < 200
abort 'Meta description should be 80-180 characters.' unless description.length.between?(80, 180)

template = File.read(File.join(SITE, 'loan-kya-hai', 'index.html'))
prefix = template.split('<div class="article-wrap">', 2).first
footer_index = template.index('<footer class="footer">')
raise 'Post template footer not found' unless footer_index
footer = template[footer_index..]
canonical = "https://loankaise.in/#{slug}/"

schema = {
  '@context' => 'https://schema.org', '@type' => 'Article', 'headline' => title,
  'description' => description, 'datePublished' => Date.today.iso8601,
  'dateModified' => Date.today.iso8601,
  'author' => { '@type' => 'Person', 'name' => 'Ashok' },
  'publisher' => { '@type' => 'Organization', 'name' => 'LoanKaise.in' },
  'mainEntityOfPage' => canonical
}
schema['image'] = image unless image.empty?

prefix.sub!(/<title>.*?<\/title>/m, "<title>#{CGI.escapeHTML(meta_title)} | LoanKaise.in</title>")
prefix.sub!(/<meta name="description" content="[^"]*">/, %Q(<meta name="description" content="#{CGI.escapeHTML(description)}">))
prefix.sub!(/<link rel="canonical" href="[^"]*">/, %Q(<link rel="canonical" href="#{canonical}">))
prefix.sub!(/<script type="application\/ld\+json">.*?<\/script>/m, %Q(<script type="application/ld+json">#{JSON.generate(schema)}</script>))
prefix.sub!('</head>', %Q(<meta name="keywords" content="#{CGI.escapeHTML(keyword)}"><meta property="og:type" content="article"><meta property="og:title" content="#{CGI.escapeHTML(meta_title)}"><meta property="og:description" content="#{CGI.escapeHTML(description)}"><meta property="og:url" content="#{canonical}">#{image.empty? ? '' : %Q(<meta property="og:image" content="#{CGI.escapeHTML(image)}">)}</head>))

article_html = markdown_to_html(body)
featured = image.empty? ? '' : %Q(<figure><img src="#{CGI.escapeHTML(image)}" alt="#{CGI.escapeHTML(title)}" loading="eager"></figure>)
article = %Q(<div class="article-wrap"><main class="article"><div class="breadcrumbs"><a href="../">Home</a> / #{CGI.escapeHTML(category)}</div><h1>#{CGI.escapeHTML(title)}</h1><div class="meta">Ashok द्वारा • #{Date.today.iso8601}</div><div class="notice"><b>महत्वपूर्ण:</b> बैंक की दरें और नियम बदल सकते हैं। निर्णय से पहले संबंधित बैंक की official website पर जानकारी verify करें।</div><div class="entry-content">#{featured}#{monetize(article_html)}</div></main></div>\n)

post_dir = File.join(SITE, slug)
FileUtils.mkdir_p(post_dir)
File.write(File.join(post_dir, 'index.html'), prefix + article + footer)

add_to_listing(File.join(SITE, 'index.html'), "#{slug}/", title, 10)
add_to_listing(File.join(SITE, 'category', 'loan-blog', 'index.html'), "../../#{slug}/", title)

category_paths = {
  'Loan Gyan' => 'loan-gyan', 'Bank' => 'bank', 'News' => 'news',
  'Personal Loan' => 'loankasie-in-hindi/personal-loan',
  'Home Loan' => 'loankasie-in-hindi/home-loan',
  'Business Loan' => 'loankasie-in-hindi/business-loan',
  'Education Loan' => 'loankasie-in-hindi/education-loan',
  'Gold Loan' => 'loankasie-in-hindi/gold-loan',
  'Car Loan' => 'loankasie-in-hindi/car-loan',
  'Property Loan' => 'loankasie-in-hindi/property-loan',
  'Corporate Loan' => 'loankasie-in-hindi/corporate-loan'
}
category_path = category_paths.fetch(category)
category_file = File.join(SITE, 'category', category_path, 'index.html')
depth = category_path.count('/') + 2
add_to_listing(category_file, "#{'../' * depth}#{slug}/", title)

sitemap = File.read(File.join(SITE, 'sitemap.xml'))
sitemap.gsub!(%r{<url><loc>#{Regexp.escape(canonical)}</loc></url>}, '')
sitemap.sub!('</urlset>', "<url><loc>#{CGI.escapeHTML(canonical)}</loc></url></urlset>")
File.write(File.join(SITE, 'sitemap.xml'), sitemap)

record = {
  title: title, slug: slug, category: category, meta_title: meta_title,
  description: description, keyword: keyword, image: image,
  published: Date.today.iso8601, body_markdown: body
}
FileUtils.mkdir_p(File.join(ROOT, 'content', 'posts'))
File.write(File.join(ROOT, 'content', 'posts', "#{slug}.json"), JSON.pretty_generate(record) + "\n")

if ENV['GITHUB_ENV']
  File.open(ENV['GITHUB_ENV'], 'a') { |file| file.puts "PUBLISHED_SLUG=#{slug}" }
end
puts "Published #{canonical}"
