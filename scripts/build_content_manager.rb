#!/usr/bin/env ruby
require 'cgi'

root = File.expand_path('..', __dir__)
site = File.join(root, 'site')
repo = 'https://github.com/9097881689/loankaise-site'

def page_title(file)
  html = File.read(file)
  value = html[/<h1[^>]*>(.*?)<\/h1>/mi, 1] || html[/<title[^>]*>(.*?)<\/title>/mi, 1] || File.basename(File.dirname(file))
  CGI.unescapeHTML(value.gsub(/<[^>]+>/, ' ').gsub(/\s+/, ' ').strip)
end

posts = Dir.glob(File.join(site, '*', 'index.html')).select do |file|
  File.read(file).include?('class="article-wrap"')
end.map do |file|
  slug = File.basename(File.dirname(file))
  [page_title(file), slug]
end.sort_by { |title, _| title.downcase }

tools = Dir.glob(File.join(site, 'tools', '*.html')).map do |file|
  [page_title(file), File.basename(file)]
end.sort_by { |title, _| title.downcase }

lines = [
  '# LoanKaise Content Manager', '',
  "[➕ नया Post Publish करें](#{repo}/issues/new?template=publish-post.yml) · [✏️ Edit/Delete Request](#{repo}/issues/new?template=manage-content.yml)", '',
  '> Edit/Delete form में नीचे दी गई Slug या Tool File Name copy करें। Login के बिना management action नहीं चलेगा।', '',
  "## Posts (#{posts.length})", '',
  '| Post | Slug | Live |', '|---|---|---|'
]
posts.each do |title, slug|
  safe_title = title.gsub('|', '\\|')
  lines << "| #{safe_title} | `#{slug}` | [देखें](https://loankaise.in/#{slug}/) |"
end
lines += ['', "## Tools (#{tools.length})", '', '| Tool | File Name | Live |', '|---|---|---|']
tools.each do |title, filename|
  safe_title = title.gsub('|', '\\|')
  lines << "| #{safe_title} | `#{filename}` | [देखें](https://loankaise.in/tools/#{filename}) |"
end

File.write(File.join(root, 'CONTENT_MANAGER.md'), lines.join("\n") + "\n")
puts "Content manager updated: #{posts.length} posts, #{tools.length} tools"
