import httpx
import re
from selectolax.parser import HTMLParser
from urllib.parse import urlparse
import ipaddress
import logging

logger = logging.getLogger(__name__)

# SSRF protection
BLOCKED_NETWORKS = [
    ipaddress.ip_network('127.0.0.0/8'),    # localhost
    ipaddress.ip_network('10.0.0.0/8'),     # private
    ipaddress.ip_network('172.16.0.0/12'),  # private
    ipaddress.ip_network('192.168.0.0/16'), # private
    ipaddress.ip_network('169.254.0.0/16'), # link-local
]

def is_safe_url(url: str) -> bool:
    """Check if URL is safe (SSRF protection)"""
    try:
        parsed = urlparse(url)
        
        # Only allow http/https
        if parsed.scheme not in ['http', 'https']:
            return False
        
        # Resolve hostname to IP
        import socket
        ip = socket.gethostbyname(parsed.hostname)
        ip_addr = ipaddress.ip_address(ip)
        
        # Check against blocked networks
        for network in BLOCKED_NETWORKS:
            if ip_addr in network:
                return False
        
        return True
        
    except Exception as e:
        logger.warning(f"URL safety check failed for {url}: {e}")
        return False

def extract_main_content(html: str) -> str:
    """Extract main content from HTML"""
    tree = HTMLParser(html)
    
    # Try to find article tag first
    article = tree.css_first('article')
    if article:
        text = article.text(strip=True)
        if len(text) > 500:  # Minimum content length
            return text
    
    # Fallback: find the longest text block
    content_selectors = [
        'main', '.content', '.article', '.post', 
        '.entry-content', '.post-content', 'section'
    ]
    
    longest_text = ""
    
    for selector in content_selectors:
        elements = tree.css(selector)
        for element in elements:
            text = element.text(strip=True)
            if len(text) > len(longest_text):
                longest_text = text
    
    # If still no good content, get all paragraphs
    if len(longest_text) < 500:
        paragraphs = tree.css('p')
        all_text = ' '.join([p.text(strip=True) for p in paragraphs if p.text(strip=True)])
        if len(all_text) > len(longest_text):
            longest_text = all_text
    
    # Clean up text
    longest_text = re.sub(r'\s+', ' ', longest_text)
    longest_text = longest_text.strip()
    
    return longest_text

async def parse_url(url: str) -> str:
    """Parse content from URL with SSRF protection"""
    
    # Basic URL validation
    if not url.startswith(('http://', 'https://')):
        raise ValueError("URL must start with http:// or https://")
    
    # SSRF protection
    if not is_safe_url(url):
        raise ValueError("URL is not allowed (security restriction)")
    
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
    }
    
    async with httpx.AsyncClient(timeout=10.0) as client:
        try:
            response = await client.get(url, headers=headers, follow_redirects=True)
            response.raise_for_status()
            
            content = extract_main_content(response.text)
            
            if len(content) < 100:
                raise ValueError("Insufficient content extracted from URL")
            
            logger.info(f"Successfully parsed {len(content)} characters from {url}")
            return content
            
        except httpx.TimeoutException:
            raise ValueError("Request timeout - URL took too long to respond")
        except httpx.HTTPStatusError as e:
            raise ValueError(f"HTTP error {e.response.status_code}: {e.response.reason_phrase}")
        except Exception as e:
            raise ValueError(f"Failed to fetch URL: {str(e)}")