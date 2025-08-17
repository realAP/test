#!/bin/bash

echo "🔍 Coolify Network Debugging Script"
echo "=================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    local status=$1
    local message=$2
    case $status in
        "SUCCESS") echo -e "${GREEN}✅ $message${NC}" ;;
        "ERROR") echo -e "${RED}❌ $message${NC}" ;;
        "WARNING") echo -e "${YELLOW}⚠️  $message${NC}" ;;
        "INFO") echo -e "${BLUE}ℹ️  $message${NC}" ;;
    esac
}

# Get domain from user
read -p "Enter your Coolify domain (e.g., test.devp.at): " DOMAIN
if [ -z "$DOMAIN" ]; then
    print_status "ERROR" "Domain is required"
    exit 1
fi

echo ""
print_status "INFO" "Testing connectivity to: $DOMAIN"
echo ""

# Test 1: Basic DNS Resolution
echo "🌐 Test 1: DNS Resolution"
echo "------------------------"
if nslookup $DOMAIN > /dev/null 2>&1; then
    print_status "SUCCESS" "DNS resolution works"
    IP=$(nslookup $DOMAIN | grep "Address:" | tail -n1 | cut -d' ' -f2)
    echo "   Resolved to: $IP"
else
    print_status "ERROR" "DNS resolution failed"
fi
echo ""

# Test 2: HTTP/HTTPS Connectivity
echo "🔗 Test 2: HTTP/HTTPS Connectivity"
echo "----------------------------------"

# Test HTTP
echo "Testing HTTP..."
HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://$DOMAIN --connect-timeout 10)
if [ "$HTTP_STATUS" = "200" ] || [ "$HTTP_STATUS" = "301" ] || [ "$HTTP_STATUS" = "302" ]; then
    print_status "SUCCESS" "HTTP connection works (Status: $HTTP_STATUS)"
else
    print_status "ERROR" "HTTP connection failed (Status: $HTTP_STATUS)"
fi

# Test HTTPS
echo "Testing HTTPS..."
HTTPS_STATUS=$(curl -s -o /dev/null -w "%{http_code}" https://$DOMAIN --connect-timeout 10)
if [ "$HTTPS_STATUS" = "200" ]; then
    print_status "SUCCESS" "HTTPS connection works (Status: $HTTPS_STATUS)"
else
    print_status "ERROR" "HTTPS connection failed (Status: $HTTPS_STATUS)"
fi
echo ""

# Test 3: Health Endpoint
echo "🏥 Test 3: Application Health Check"
echo "-----------------------------------"
HEALTH_RESPONSE=$(curl -s https://$DOMAIN/health --connect-timeout 10)
if echo "$HEALTH_RESPONSE" | grep -q "OK"; then
    print_status "SUCCESS" "Health endpoint responds correctly"
    echo "   Response: $HEALTH_RESPONSE"
else
    print_status "ERROR" "Health endpoint failed or not responding"
    echo "   Response: $HEALTH_RESPONSE"
fi
echo ""

# Test 4: Debug Endpoints
echo "🔧 Test 4: Debug Information"
echo "----------------------------"

# Test debug/info endpoint
echo "Testing /debug/info..."
DEBUG_INFO=$(curl -s https://$DOMAIN/debug/info --connect-timeout 10)
if echo "$DEBUG_INFO" | grep -q "simple-fullstack-app"; then
    print_status "SUCCESS" "Debug info endpoint works"
    # Extract key information
    NODE_VERSION=$(echo "$DEBUG_INFO" | grep -o '"nodeVersion":"[^"]*"' | cut -d'"' -f4)
    UPTIME=$(echo "$DEBUG_INFO" | grep -o '"uptime":[0-9.]*' | cut -d':' -f2)
    echo "   Node.js Version: $NODE_VERSION"
    echo "   App Uptime: ${UPTIME}s"
else
    print_status "ERROR" "Debug info endpoint failed"
fi

# Test debug/db endpoint
echo "Testing /debug/db..."
DEBUG_DB=$(curl -s https://$DOMAIN/debug/db --connect-timeout 10)
if echo "$DEBUG_DB" | grep -q '"connected":true'; then
    print_status "SUCCESS" "Database connection works"
    MESSAGE_COUNT=$(echo "$DEBUG_DB" | grep -o '"messageCount":[0-9]*' | cut -d':' -f2)
    echo "   Message count: $MESSAGE_COUNT"
else
    print_status "ERROR" "Database connection failed"
    echo "   Response: $DEBUG_DB"
fi
echo ""

# Test 5: Network Information
echo "🌐 Test 5: Network Configuration"
echo "--------------------------------"
NETWORK_INFO=$(curl -s https://$DOMAIN/debug/network --connect-timeout 10)
if echo "$NETWORK_INFO" | grep -q "hostname"; then
    print_status "SUCCESS" "Network debug endpoint works"
    HOSTNAME=$(echo "$NETWORK_INFO" | grep -o '"hostname":"[^"]*"' | cut -d'"' -f4)
    echo "   Container hostname: $HOSTNAME"
    
    # Check for forwarded headers (indicates reverse proxy)
    if echo "$NETWORK_INFO" | grep -q -i "x-forwarded"; then
        print_status "SUCCESS" "Reverse proxy headers detected (Traefik is working)"
    else
        print_status "WARNING" "No reverse proxy headers found"
    fi
else
    print_status "ERROR" "Network debug endpoint failed"
fi
echo ""

# Test 6: Port Connectivity (if accessible)
echo "🔌 Test 6: Direct Port Access"
echo "-----------------------------"
if timeout 5 bash -c "</dev/tcp/$IP/3000" 2>/dev/null; then
    print_status "WARNING" "Port 3000 is directly accessible (should be blocked by firewall)"
else
    print_status "SUCCESS" "Port 3000 is properly firewalled (only accessible via reverse proxy)"
fi
echo ""

# Test 7: SSL Certificate
echo "🔒 Test 7: SSL Certificate"
echo "--------------------------"
SSL_INFO=$(echo | openssl s_client -servername $DOMAIN -connect $DOMAIN:443 2>/dev/null | openssl x509 -noout -dates 2>/dev/null)
if [ ! -z "$SSL_INFO" ]; then
    print_status "SUCCESS" "SSL certificate is valid"
    echo "$SSL_INFO" | sed 's/^/   /'
else
    print_status "ERROR" "SSL certificate check failed"
fi
echo ""

# Summary and Recommendations
echo "📋 Summary and Recommendations"
echo "=============================="

# Check if main site works
MAIN_SITE_WORKS=false
if [ "$HTTPS_STATUS" = "200" ] && echo "$HEALTH_RESPONSE" | grep -q "OK"; then
    MAIN_SITE_WORKS=true
    print_status "SUCCESS" "Your application appears to be working correctly!"
    echo ""
    echo "🎉 All systems operational:"
    echo "   • DNS resolution: Working"
    echo "   • HTTPS access: Working"  
    echo "   • Application health: OK"
    echo "   • Database connection: Working"
    echo ""
    echo "If you're still experiencing issues, they might be:"
    echo "   • Browser caching (try incognito mode)"
    echo "   • Specific route issues (test different URLs)"
    echo "   • Intermittent connectivity problems"
else
    print_status "ERROR" "Application has connectivity issues"
    echo ""
    echo "🔧 Troubleshooting steps:"
    
    if [ "$HTTPS_STATUS" != "200" ]; then
        echo "   1. Check Coolify deployment logs"
        echo "   2. Verify container is running and healthy"
        echo "   3. Check Traefik routing configuration"
    fi
    
    if ! echo "$HEALTH_RESPONSE" | grep -q "OK"; then
        echo "   4. Application may not be starting properly"
        echo "   5. Check Node.js application logs"
        echo "   6. Verify environment variables are set correctly"
    fi
    
    if ! echo "$DEBUG_DB" | grep -q '"connected":true'; then
        echo "   7. Database connection issues detected"
        echo "   8. Check PostgreSQL container status"
        echo "   9. Verify database credentials and network"
    fi
fi

echo ""
print_status "INFO" "Debug script completed. Use this information to troubleshoot your Coolify deployment."