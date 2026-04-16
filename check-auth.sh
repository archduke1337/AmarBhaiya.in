#!/bin/bash
# Diagnostic script for AmarBhaiya.in authentication issues
# Run: bash check-auth.sh

echo "🔍 AmarBhaiya.in Authentication Diagnostic"
echo "=========================================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check 1: .env.local exists
echo "1️⃣  Checking .env.local..."
if [ -f ".env.local" ]; then
    echo -e "${GREEN}✓ .env.local exists${NC}"
else
    echo -e "${RED}✗ .env.local NOT FOUND${NC}"
    echo "  Create it with: cp .env.example .env.local"
fi
echo ""

# Check 2: Environment variables
echo "2️⃣  Checking environment variables..."
if [ -f ".env.local" ]; then
    source .env.local
    
    if [ -z "$NEXT_PUBLIC_APPWRITE_ENDPOINT" ]; then
        echo -e "${RED}✗ NEXT_PUBLIC_APPWRITE_ENDPOINT not set${NC}"
    else
        echo -e "${GREEN}✓ NEXT_PUBLIC_APPWRITE_ENDPOINT = $NEXT_PUBLIC_APPWRITE_ENDPOINT${NC}"
    fi
    
    if [ -z "$NEXT_PUBLIC_APPWRITE_PROJECT_ID" ]; then
        echo -e "${RED}✗ NEXT_PUBLIC_APPWRITE_PROJECT_ID not set${NC}"
    else
        echo -e "${GREEN}✓ NEXT_PUBLIC_APPWRITE_PROJECT_ID = $NEXT_PUBLIC_APPWRITE_PROJECT_ID${NC}"
    fi
    
    if [ -z "$APPWRITE_API_KEY" ]; then
        echo -e "${RED}✗ APPWRITE_API_KEY not set${NC}"
    else
        echo -e "${GREEN}✓ APPWRITE_API_KEY is set${NC}"
    fi
fi
echo ""

# Check 3: Appwrite connectivity
echo "3️⃣  Checking Appwrite connectivity..."
if [ -n "$NEXT_PUBLIC_APPWRITE_ENDPOINT" ]; then
    HEALTH_CHECK=$(curl -s -o /dev/null -w "%{http_code}" "$NEXT_PUBLIC_APPWRITE_ENDPOINT/health")
    if [ "$HEALTH_CHECK" == "200" ]; then
        echo -e "${GREEN}✓ Appwrite is reachable ($NEXT_PUBLIC_APPWRITE_ENDPOINT)${NC}"
    else
        echo -e "${RED}✗ Appwrite returned status $HEALTH_CHECK${NC}"
        echo "  Check if Appwrite is running: docker compose ps"
    fi
else
    echo -e "${YELLOW}⚠ Skipping (ENDPOINT not set)${NC}"
fi
echo ""

# Check 4: Node version
echo "4️⃣  Checking Node.js version..."
if command -v node &> /dev/null; then
    NODE_VER=$(node --version)
    echo -e "${GREEN}✓ Node.js $NODE_VER${NC}"
else
    echo -e "${RED}✗ Node.js not found${NC}"
fi
echo ""

# Check 5: npm dependencies
echo "5️⃣  Checking npm dependencies..."
if [ -f "package.json" ]; then
    if [ -d "node_modules" ]; then
        echo -e "${GREEN}✓ node_modules exists${NC}"
        
        # Check specific packages
        if grep -q '"node-appwrite"' package.json; then
            echo -e "${GREEN}✓ node-appwrite is in dependencies${NC}"
        else
            echo -e "${RED}✗ node-appwrite not found${NC}"
        fi
        
        if grep -q '"next"' package.json; then
            echo -e "${GREEN}✓ next is in dependencies${NC}"
        else
            echo -e "${RED}✗ next not found${NC}"
        fi
    else
        echo -e "${RED}✗ node_modules not found${NC}"
        echo "  Run: npm install"
    fi
fi
echo ""

# Check 6: Port availability
echo "6️⃣  Checking if port 3000 is available..."
if command -v lsof &> /dev/null; then
    if ! lsof -i :3000 &> /dev/null; then
        echo -e "${GREEN}✓ Port 3000 is available${NC}"
    else
        echo -e "${YELLOW}⚠ Port 3000 is in use${NC}"
        echo "  Process: $(lsof -i :3000 | tail -1)"
    fi
else
    echo -e "${YELLOW}⚠ Cannot check port (lsof not available)${NC}"
fi
echo ""

# Summary
echo "=========================================="
echo "✅ Diagnostic complete!"
echo ""
echo "📝 Next steps:"
echo "1. Verify all ✓ checks above"
echo "2. Fix any ✗ issues"
echo "3. Run: npm run dev"
echo "4. Visit: http://localhost:3000/login"
echo ""
echo "📖 For more details, read: AUTH_SETUP_GUIDE.md"
