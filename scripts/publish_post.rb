#!/usr/bin/env ruby
require 'cgi'
require 'json'
require 'fileutils'
require 'date'
require 'uri'
require 'open-uri'

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

def build_toc(markdown)
  headings = markdown.scan(/^(##|###)\s+(.+)$/).map do |level, text|
    clean = text.strip
    anchor = clean.downcase.gsub(/[^a-z0-9\u0900-\u097f]+/, '-').gsub(/^-+|-+$/, '')
    { level: level.length, text: clean, id: anchor }
  end
  return '' if headings.length < 3
  items = headings.map do |h|
    klass = h[:level] == 3 ? ' class="toc-sub"' : ''
    %Q(<li#{klass}><a href="##{h[:id]}">#{CGI.escapeHTML(h[:text])}</a></li>)
  end.join
  %Q(<nav class="article-toc" aria-label="Table of contents"><h2>इस page में क्या है</h2><ol>#{items}</ol></nav>)
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

def seo_audit(title:, slug:, meta_title:, description:, keyword:, image:, image_alt:, body:)
  keyword_down = keyword.downcase
  slug_keyword = keyword_down.gsub(/[^a-z0-9\s-]/, ' ').split.join('-')
  first_section = body.gsub(/^#+\s+.*$/, '').strip[0, 500].to_s.downcase
  headings = body.scan(/^(?:##|###)\s+(.+)$/).flatten.join(' ').downcase
  words = body.gsub(/\[[^\]]+\]\([^)]+\)/, ' ').split.size
  links = body.scan(/\[[^\]]+\]\((https?:\/\/[^)\s]+)\)/).flatten
  internal = links.any? { |url| URI.parse(url).host.to_s.sub(/^www\./, '') == 'loankaise.in' rescue false }
  external = links.any? { |url| (URI.parse(url).host.to_s.sub(/^www\./, '') != 'loankaise.in') rescue false }

  checks = [
    [meta_title.downcase.include?(keyword_down), 12, 'Focus keyword SEO title में रखें'],
    [title.downcase.include?(keyword_down), 8, 'Focus keyword post title में रखें'],
    [slug.include?(slug_keyword) || keyword_down.split.all? { |word| slug.include?(word) }, 8, 'Focus keyword URL slug में रखें'],
    [description.downcase.include?(keyword_down), 10, 'Focus keyword meta description में रखें'],
    [first_section.include?(keyword_down), 10, 'Focus keyword शुरुआती paragraph में रखें'],
    [headings.include?(keyword_down), 8, 'Focus keyword कम से कम एक H2/H3 heading में रखें'],
    [meta_title.length.between?(45, 60), 8, "SEO title 45–60 characters रखें (अभी #{meta_title.length})"],
    [description.length.between?(140, 160), 8, "Meta description 140–160 characters रखें (अभी #{description.length})"],
    [words >= 600, 10, "Article कम से कम 600 words का रखें (अभी #{words})"],
    [body.scan(/^##\s+/).length >= 2, 5, 'कम से कम 2 H2 headings रखें'],
    [internal, 5, 'LoanKaise का कम से कम 1 internal link जोड़ें'],
    [external, 4, 'कम से कम 1 भरोसेमंद official external link जोड़ें'],
    [image.empty? || !image_alt.empty?, 4, 'Featured image के लिए alt text भरें']
  ]
  score = checks.sum { |passed, points, _| passed ? points : 0 }
  suggestions = checks.reject(&:first).map { |_, _, suggestion| suggestion }
  [score, suggestions, words]
end

def save_featured_image(raw_value, slug)
  return '' if raw_value.to_s.strip.empty?
  source = raw_value.to_s[%r{https://[^)\s]+}]
  abort 'Featured image upload link is invalid.' unless source
  data = URI.open(source, 'User-Agent' => 'LoanKaise Publisher', read_timeout: 30)
  content_type = data.content_type.to_s.downcase
  extensions = {
    'image/jpeg' => 'jpg', 'image/png' => 'png',
    'image/webp' => 'webp', 'image/gif' => 'gif'
  }
  extension = extensions[content_type]
  abort 'Featured image must be JPG, PNG, WebP or GIF.' unless extension
  bytes = data.read(5 * 1024 * 1024 + 1)
  abort 'Featured image must be smaller than 5 MB.' if bytes.bytesize > 5 * 1024 * 1024
  upload_dir = File.join(SITE, 'uploads')
  FileUtils.mkdir_p(upload_dir)
  Dir.glob(File.join(upload_dir, "#{slug}.*")).each { |old| FileUtils.rm_f(old) }
  filename = "#{slug}.#{extension}"
  File.binwrite(File.join(upload_dir, filename), bytes)
  "https://loankaise.in/uploads/#{filename}"
rescue OpenURI::HTTPError, SocketError, Timeout::Error => error
  abort "Featured image download failed: #{error.message}"
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
image_upload = fields.fetch('Featured Image Upload', '').strip
image_alt = fields.fetch('Featured Image Alt Text', '').strip
body = fields.fetch('Article Body').strip

abort 'Invalid slug. Use lowercase English letters, numbers and hyphens only.' unless slug.match?(/\A[a-z0-9]+(?:-[a-z0-9]+)*\z/)
abort 'Article body is too short.' if body.length < 200
abort 'Meta description should be 80-180 characters.' unless description.length.between?(80, 180)

image = save_featured_image(image_upload, slug)

seo_score, seo_suggestions, word_count = seo_audit(
  title: title, slug: slug, meta_title: meta_title, description: description,
  keyword: keyword, image: image, image_alt: image_alt, body: body
)

template = File.read(File.join(SITE, 'loan-kya-hai', 'index.html'))
prefix = template.split('<div class="article-wrap">', 2).first
footer_index = template.index('<footer class="footer">')
raise 'Post template footer not found' unless footer_index
footer = template[footer_index..]
canonical = "https://loankaise.in/#{slug}/"

schema = {
  '@context' => 'https://schema.org', '@type' => 'BlogPosting', 'headline' => title,
  'description' => description, 'datePublished' => Date.today.iso8601,
  'dateModified' => Date.today.iso8601,
  'author' => { '@type' => 'Person', 'name' => 'Ashok', 'url' => 'https://loankaise.in/aabout-us/' },
  'publisher' => { '@type' => 'Organization', 'name' => 'LoanKaise.in', 'url' => 'https://loankaise.in/' },
  'mainEntityOfPage' => canonical
}
schema['image'] = image unless image.empty?

prefix.sub!(/<title>.*?<\/title>/m, "<title>#{CGI.escapeHTML(meta_title)} | LoanKaise.in</title>")
prefix.sub!(/<meta name="description" content="[^"]*">/, %Q(<meta name="description" content="#{CGI.escapeHTML(description)}">))
prefix.sub!(/<link rel="canonical" href="[^"]*">/, %Q(<link rel="canonical" href="#{canonical}">))
prefix.sub!(/<script type="application\/ld\+json">.*?<\/script>/m, %Q(<script type="application/ld+json">#{JSON.generate(schema)}</script>))
prefix.sub!('</head>', %Q(<meta name="keywords" content="#{CGI.escapeHTML(keyword)}"><meta property="og:type" content="article"><meta property="og:title" content="#{CGI.escapeHTML(meta_title)}"><meta property="og:description" content="#{CGI.escapeHTML(description)}"><meta property="og:url" content="#{canonical}"><meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="#{CGI.escapeHTML(meta_title)}"><meta name="twitter:description" content="#{CGI.escapeHTML(description)}">#{image.empty? ? '' : %Q(<meta property="og:image" content="#{CGI.escapeHTML(image)}"><meta name="twitter:image" content="#{CGI.escapeHTML(image)}">)}</head>))

article_html = markdown_to_html(body)
featured_alt = image_alt.empty? ? title : image_alt
featured = image.empty? ? '' : %Q(<figure><img src="#{CGI.escapeHTML(image)}" alt="#{CGI.escapeHTML(featured_alt)}" loading="eager"></figure>)
article = %Q(<div class="article-wrap"><main class="article"><div class="breadcrumbs"><a href="../">Home</a> / #{CGI.escapeHTML(category)}</div><h1>#{CGI.escapeHTML(title)}</h1><div class="meta">Ashok द्वारा • Published: #{Date.today.iso8601} • Last updated: #{Date.today.iso8601}</div><div class="notice"><b>महत्वपूर्ण:</b> बैंक की दरें और नियम बदल सकते हैं। निर्णय से पहले संबंधित बैंक की official website पर जानकारी verify करें।</div><section class="author-card"><h2>About the author</h2><p><strong>Ashok</strong> practical banking guides, loan explainers और finance tools पर काम करते हैं. Content ko reader-first तरीके से आसान Hindi me समझाना इनका focus है.</p><div class="author-links"><a href="../aabout-us/">About Us</a><a href="../editorial-policy/">Editorial Policy</a><a href="../fact-check-policy/">Fact Check Policy</a><a href="../contact-us/">Contact</a></div></section><div class="entry-content">#{build_toc(body)}#{featured}#{monetize(article_html)}</div></main></div>\n)

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
  image_alt: image_alt, seo_score: seo_score, word_count: word_count,
  seo_suggestions: seo_suggestions, published: Date.today.iso8601, body_markdown: body
}
FileUtils.mkdir_p(File.join(ROOT, 'content', 'posts'))
File.write(File.join(ROOT, 'content', 'posts', "#{slug}.json"), JSON.pretty_generate(record) + "\n")

system('ruby', File.join(__dir__, 'refresh_indexing.rb')) or abort 'Indexing refresh failed.'

if ENV['GITHUB_ENV']
  File.open(ENV['GITHUB_ENV'], 'a') do |file|
    file.puts "PUBLISHED_SLUG=#{slug}"
    file.puts "SEO_SCORE=#{seo_score}"
    file.puts "WORD_COUNT=#{word_count}"
    file.puts "SEO_SUGGESTIONS_JSON=#{JSON.generate(seo_suggestions)}"
  end
end
puts "Published #{canonical} | SEO score: #{seo_score}/100"
