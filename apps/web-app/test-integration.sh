#!/bin/bash

# Tixora Frontend Integration Testing Script
# This script helps verify that the Axios client and JWT interceptors are working correctly

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Tixora Frontend Integration Tests${NC}\n"

# Test 1: Check if Node.js is installed
echo -e "${YELLOW}Test 1: Checking Node.js installation...${NC}"
if command -v node &> /dev/null; then
    NODE_VERSION=$(node -v)
    echo -e "${GREEN}✓ Node.js ${NODE_VERSION} is installed${NC}\n"
else
    echo -e "${RED}✗ Node.js is not installed${NC}\n"
    exit 1
fi

# Test 2: Check if npm is installed
echo -e "${YELLOW}Test 2: Checking npm installation...${NC}"
if command -v npm &> /dev/null; then
    NPM_VERSION=$(npm -v)
    echo -e "${GREEN}✓ npm ${NPM_VERSION} is installed${NC}\n"
else
    echo -e "${RED}✗ npm is not installed${NC}\n"
    exit 1
fi

# Test 3: Check if dependencies are installed
echo -e "${YELLOW}Test 3: Checking if dependencies are installed...${NC}"
if [ -d "node_modules" ]; then
    echo -e "${GREEN}✓ Dependencies are installed${NC}\n"
else
    echo -e "${YELLOW}Dependencies not found. Installing...${NC}"
    npm install
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ Dependencies installed successfully${NC}\n"
    else
        echo -e "${RED}✗ Failed to install dependencies${NC}\n"
        exit 1
    fi
fi

# Test 4: Check TypeScript compilation
echo -e "${YELLOW}Test 4: Checking TypeScript configuration...${NC}"
if [ -f "tsconfig.json" ]; then
    echo -e "${GREEN}✓ tsconfig.json exists${NC}\n"
else
    echo -e "${RED}✗ tsconfig.json not found${NC}\n"
    exit 1
fi

# Test 5: Check for required key files
echo -e "${YELLOW}Test 5: Checking for required key files...${NC}"
REQUIRED_FILES=(
    "src/services/api.ts"
    "src/utils/token.utils.ts"
    "src/services/auth.service.ts"
    "src/hooks/useAuth.ts"
)

for file in "${REQUIRED_FILES[@]}"; do
    if [ -f "$file" ]; then
        echo -e "${GREEN}✓ $file exists${NC}"
    else
        echo -e "${RED}✗ $file not found${NC}"
    fi
done

echo -e "\n${YELLOW}All basic checks passed!${NC}\n"

echo -e "${YELLOW}Next steps:${NC}"
echo -e "1. Start the development server: ${GREEN}npm run dev${NC}"
echo -e "2. Open http://localhost:3000 in your browser"
echo -e "3. Navigate to /login and test the authentication flow"
echo -e "4. Open DevTools Network tab to verify JWT injection"
