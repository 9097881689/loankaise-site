#!/usr/bin/env ruby
# frozen_string_literal: true

require 'cgi'
require 'date'
require 'fileutils'
require 'rexml/document'
require 'uri'
require 'time'

ROOT = File.expand_path('..', __dir__)
SITE = File.join(ROOT, 'site')
DOMAIN = 'https://loankaise.in'
TODAY = Date.today.iso8601

def read(file)
  File.read(file, encoding: 'UTF-8')
rescue Encoding::InvalidByteSequenceError, Encoding::UndefinedConversionError
  File.read(file).encode('UTF-8', invalid: :replace, undef: :replace)
end

def canonical_for(file, html)
  if (m = html.match(/<link\s+rel=["']canonical["']\s+href=["']([^"']+)["']/i))
    return normalize_url(m[1])
  end
  rel = file.delete_prefix("#{SITE}/").delete_suffix('/index.html')
  rel = '' if rel == 'index.html'
  normalize_url("#{DOMAIN}/#{rel}/")
end

def normalize_url(url)
  url = url.strip
  url = "#{DOMAIN}#{url}" if url.start_with?('/')
  url = url.sub(%r{\Ahttp://loankaise\.in}i, DOMAIN)
  return url if url == "#{DOMAIN}/"
  url = url.sub(%r{/index\.html\z}i, '/')
  url.end_with?('/') ? url : "#{url}/"
end

def title_for(html)
  CGI.unescapeHTML(html[/<title[^>]*>(.*?)<\/title>/mi, 1].to_s.gsub(/\s+/, ' ').strip)
end

def description_for(html)
  CGI.unescapeHTML(html[/<meta\s+name=["']description["']\s+content=["']([^"']*)["']/i, 1].to_s.strip)
end

def indexable?(file, html)
  return false if file.end_with?('/404.html')
  return false if html.match?(/<meta\s+name=["']robots["'][^>]+content=["'][^"']*noindex/i)
  return false if file.include?('/tools/banking-mock-test/index.html') # duplicate of legacy tool URL
  true
end

def page_kind(url)
  path = URI(url).path rescue url.sub(DOMAIN, '')
  return :home if path == '/'
  return :calculator if path.include?('calculator') || path == '/loan-eligibility/' || path == '/application-generator/' || path == '/prepayment-calculator/'
  return :mock if path.start_with?('/mock-test/')
  return :category if path.start_with?('/category/')
  return :legal if path.match?(%r{/(privacy-policy|terms-and-conditions|desclaimer|disclaimer|editorial-policy|fact-check-policy|contact-us|aabout-us|html-sitemap)/})
  :post
end

def priority_for(kind)
  { home: '1.00', calculator: '0.85', mock: '0.82', category: '0.70', post: '0.64', legal: '0.35' }.fetch(kind, '0.50')
end

def changefreq_for(kind)
  { home: 'daily', calculator: 'weekly', mock: 'weekly', category: 'daily', post: 'monthly', legal: 'yearly' }.fetch(kind, 'monthly')
end

def xml_escape(value)
  CGI.escapeHTML(value.to_s)
end

def build_urlset(pages)
  body = pages.sort_by { |p| [p[:kind] == :home ? 0 : 1, p[:url]] }.map do |p|
    "  <url><loc>#{xml_escape(p[:url])}</loc><lastmod>#{p[:lastmod]}</lastmod><changefreq>#{p[:changefreq]}</changefreq><priority>#{p[:priority]}</priority></url>"
  end.join("\n")
  %(<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n#{body}\n</urlset>\n)
end

def build_feed(pages)
  feed_pages = pages.select { |p| %i[post calculator mock].include?(p[:kind]) }.sort_by { |p| p[:mtime] }.reverse.first(60)
  items = feed_pages.map do |p|
    <<~XML
      <item>
        <title>#{xml_escape(p[:title].empty? ? 'LoanKaise update' : p[:title])}</title>
        <link>#{xml_escape(p[:url])}</link>
        <guid isPermaLink="true">#{xml_escape(p[:url])}</guid>
        <pubDate>#{p[:mtime].httpdate}</pubDate>
        <description>#{xml_escape(p[:description])}</description>
      </item>
    XML
  end.join
  <<~XML
    <?xml version="1.0" encoding="UTF-8"?>
    <rss version="2.0">
      <channel>
        <title>LoanKaise.in Updates</title>
        <link>#{DOMAIN}/</link>
        <description>Latest banking guides, finance calculators and mock tests from LoanKaise.in.</description>
        <language>hi-IN</language>
        <lastBuildDate>#{Time.now.httpdate}</lastBuildDate>
    #{items}  </channel>
    </rss>
  XML
end

pages = []
Dir.glob(File.join(SITE, '**', 'index.html')).each do |file|
  html = read(file)
  next unless indexable?(file, html)

  url = canonical_for(file, html)
  next unless url.start_with?("#{DOMAIN}/")

  kind = page_kind(url)
  mtime = File.mtime(file)
  pages << {
    file: file,
    url: url,
    title: title_for(html),
    description: description_for(html),
    kind: kind,
    lastmod: [mtime.to_date.iso8601, TODAY].max,
    mtime: mtime,
    priority: priority_for(kind),
    changefreq: changefreq_for(kind)
  }
end

pages.uniq! { |p| p[:url] }

File.write(File.join(SITE, 'sitemap.xml'), build_urlset(pages))
File.write(File.join(SITE, 'sitemap-calculators.xml'), build_urlset(pages.select { |p| p[:kind] == :calculator }))
File.write(File.join(SITE, 'sitemap-mock-tests.xml'), build_urlset(pages.select { |p| p[:kind] == :mock }))
File.write(File.join(SITE, 'feed.xml'), build_feed(pages))

robots_file = File.join(SITE, 'robots.txt')
robots = File.exist?(robots_file) ? read(robots_file) : "User-agent: *\nAllow: /\n"
[
  'Sitemap: https://loankaise.in/sitemap.xml',
  'Sitemap: https://loankaise.in/sitemap-calculators.xml',
  'Sitemap: https://loankaise.in/sitemap-mock-tests.xml',
  'Sitemap: https://loankaise.in/feed.xml'
].each do |line|
  robots = "#{robots.rstrip}\n#{line}\n" unless robots.include?(line)
end
File.write(robots_file, robots)

puts "Indexing files refreshed: #{pages.size} URLs, #{pages.count { |p| p[:kind] == :calculator }} calculators, #{pages.count { |p| p[:kind] == :mock }} mock tests"
