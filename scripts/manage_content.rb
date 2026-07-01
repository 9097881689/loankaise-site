#!/usr/bin/env ruby
require 'cgi'
require 'fileutils'
require 'open-uri'
require 'uri'
require 'json'
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
  safe.gsub(/\*\*(.+?)\*\*/, '<strong>\\1</strong>')
end

def markdown_to_html(markdown)
  html = []
  paragraph = []
  in_list = false
  flush = lambda do
    unless paragraph.empty?
      html << "<p>#{inline_markdown(paragraph.join(' '))}</p>"
      paragraph.clear
    end
  end
  markdown.gsub("\r\n", "\n").lines.map(&:chomp).each do |line|
    if line.start_with?('### ') || line.start_with?('## ')
      flush.call
      html << '</ul>' if in_list
      in_list = false
      level = line.start_with?('### ') ? 3 : 2
      html << "<h#{level}>#{inline_markdown(line.sub(/^#{'#' * level}\s+/, '').strip)}</h#{level}>"
    elsif line.match?(/^[-*]\s+/)
      flush.call
      html << '<ul>' unless in_list
      in_list = true
      html << "<li>#{inline_markdown(line.sub(/^[-*]\s+/, ''))}</li>"
    elsif line.strip.empty?
      flush.call
      html << '</ul>' if in_list
      in_list = false
    else
      paragraph << line.strip
    end
  end
  flush.call
  html << '</ul>' if in_list
  html.join("\n")
end

def save_image(raw_value, slug)
  return '' if raw_value.to_s.strip.empty?
  source = raw_value.to_s[%r{https://[^)\s]+}]
  abort 'Image upload link is invalid.' unless source
  data = URI.open(source, 'User-Agent' => 'LoanKaise Manager', read_timeout: 30)
  extension = {'image/jpeg'=>'jpg','image/png'=>'png','image/webp'=>'webp','image/gif'=>'gif'}[data.content_type.to_s.downcase]
  abort 'Image must be JPG, PNG, WebP or GIF.' unless extension
  bytes = data.read(5 * 1024 * 1024 + 1)
  abort 'Image must be smaller than 5 MB.' if bytes.bytesize > 5 * 1024 * 1024
  FileUtils.mkdir_p(File.join(SITE, 'uploads'))
  Dir.glob(File.join(SITE, 'uploads', "#{slug}.*")).each { |old| FileUtils.rm_f(old) }
  filename = "#{slug}.#{extension}"
  File.binwrite(File.join(SITE, 'uploads', filename), bytes)
  "https://loankaise.in/uploads/#{filename}"
end

def update_list_titles(slug, title)
  Dir.glob(File.join(SITE, '**', 'index.html')).each do |file|
    html = File.read(file)
    changed = html.gsub(/(<a class="post-row"[^>]+href="[^"]*#{Regexp.escape(slug)}\/"[^>]*>.*?<h3>).*?(<\/h3>.*?<\/a>)/m) do
      "#{$1}#{CGI.escapeHTML(title)}#{$2}"
    end
    File.write(file, changed) if changed != html
  end
end

def remove_from_lists(slug)
  Dir.glob(File.join(SITE, '**', 'index.html')).each do |file|
    html = File.read(file)
    changed = html.gsub(/<a class="post-row"[^>]+href="[^"]*#{Regexp.escape(slug)}\/"[^>]*>.*?<\/a>/m, '')
    File.write(file, changed) if changed != html
  end
end

fields = sections(ENV.fetch('ISSUE_BODY'))
type = fields.fetch('Content Type')
action = fields.fetch('Action')
slug = fields.fetch('Slug or Tool File Name').strip
abort 'Invalid post slug.' if type == 'Post' && (slug.empty? || slug.include?('/') || slug.include?('\\') || %w[. ..].include?(slug))
abort 'Invalid tool file name.' if type == 'Tool' && !slug.match?(/\A[a-z0-9-]+\.html\z/)

target = type == 'Post' ? File.join(SITE, slug, 'index.html') : File.join(SITE, 'tools', slug)
abort "Content not found: #{slug}" unless File.file?(target)

if action == 'Delete'
  if type == 'Post'
    FileUtils.rm_rf(File.dirname(target))
    FileUtils.rm_f(File.join(ROOT, 'content', 'posts', "#{slug}.json"))
    Dir.glob(File.join(SITE, 'uploads', "#{slug}.*")).each { |image| FileUtils.rm_f(image) }
    remove_from_lists(slug)
    sitemap_file = File.join(SITE, 'sitemap.xml')
    sitemap = File.read(sitemap_file)
    sitemap.gsub!(%r{<url><loc>https://loankaise\.in/#{Regexp.escape(slug)}/</loc></url>}, '')
    File.write(sitemap_file, sitemap)
  else
    FileUtils.rm_f(target)
  end
  result_url = type == 'Post' ? "https://loankaise.in/#{slug}/" : "https://loankaise.in/tools/#{slug}"
else
  if type == 'Tool'
    tool_html = fields.fetch('New Tool HTML', '').sub(/\A```html\s*/m, '').sub(/\s*```\z/m, '')
    abort 'New Tool HTML is required for Tool Edit.' if tool_html.empty?
    File.write(target, tool_html)
  else
    html = File.read(target)
    title = fields.fetch('New Post Title', '')
    meta_title = fields.fetch('New SEO Meta Title', '')
    description = fields.fetch('New SEO Meta Description', '')
    article_body = fields.fetch('New Post Article Body', '')
    image_upload = fields.fetch('New Featured Image Upload', '')
    image_alt = fields.fetch('New Image Alt Text', '')
    unless title.empty?
      html.sub!(/<h1[^>]*>.*?<\/h1>/m, "<h1>#{CGI.escapeHTML(title)}</h1>")
      update_list_titles(slug, title)
    end
    unless meta_title.empty?
      html.sub!(/<title>.*?<\/title>/m, "<title>#{CGI.escapeHTML(meta_title)} | LoanKaise.in</title>")
      html.sub!(/<meta property="og:title" content="[^"]*">/, %Q(<meta property="og:title" content="#{CGI.escapeHTML(meta_title)}">))
    end
    unless description.empty?
      html.sub!(/<meta name="description" content="[^"]*">/, %Q(<meta name="description" content="#{CGI.escapeHTML(description)}">))
      html.sub!(/<meta property="og:description" content="[^"]*">/, %Q(<meta property="og:description" content="#{CGI.escapeHTML(description)}">))
    end
    unless article_body.empty?
      html.sub!(/<div class="entry-content">.*?<\/div><\/main>/m, "<div class=\"entry-content\">#{markdown_to_html(article_body)}</div></main>")
    end
    image = save_image(image_upload, slug)
    unless image.empty?
      alt = image_alt.empty? ? (title.empty? ? slug.tr('-', ' ') : title) : image_alt
      figure = %Q(<figure><img src="#{image}" alt="#{CGI.escapeHTML(alt)}" loading="eager"></figure>)
      if html.match?(/<div class="entry-content"><figure>.*?<\/figure>/m)
        html.sub!(/(<div class="entry-content">)<figure>.*?<\/figure>/m, "\\1#{figure}")
      else
        html.sub!('<div class="entry-content">', "<div class=\"entry-content\">#{figure}")
      end
      if html.match?(/<meta property="og:image" content="[^"]*">/)
        html.sub!(/<meta property="og:image" content="[^"]*">/, %Q(<meta property="og:image" content="#{image}">))
      else
        html.sub!('</head>', %Q(<meta property="og:image" content="#{image}"></head>))
      end
    end
    html.sub!(/<script type="application\/ld\+json">(.*?)<\/script>/m) do
      schema = JSON.parse($1) rescue nil
      if schema
        schema['headline'] = title unless title.empty?
        schema['description'] = description unless description.empty?
        schema['image'] = image unless image.empty?
        schema['dateModified'] = Date.today.iso8601
        %Q(<script type="application/ld+json">#{JSON.generate(schema)}</script>)
      else
        $&
      end
    end
    File.write(target, html)
    record_file = File.join(ROOT, 'content', 'posts', "#{slug}.json")
    if File.file?(record_file)
      record = JSON.parse(File.read(record_file))
      record['title'] = title unless title.empty?
      record['meta_title'] = meta_title unless meta_title.empty?
      record['description'] = description unless description.empty?
      record['body_markdown'] = article_body unless article_body.empty?
      record['image'] = image unless image.empty?
      record['image_alt'] = image_alt unless image_alt.empty?
      File.write(record_file, JSON.pretty_generate(record) + "\n")
    end
  end
  result_url = type == 'Post' ? "https://loankaise.in/#{slug}/" : "https://loankaise.in/tools/#{slug}"
end

system('ruby', File.join(__dir__, 'build_content_manager.rb')) or abort 'Content manager refresh failed.'
if ENV['GITHUB_ENV']
  File.open(ENV['GITHUB_ENV'], 'a') do |file|
    file.puts "MANAGE_ACTION=#{action}"
    file.puts "MANAGED_URL=#{result_url}"
  end
end
puts "#{action} completed: #{result_url}"
