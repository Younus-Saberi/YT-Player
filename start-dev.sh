#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}🎵 YouTube to MP3 Converter - Development Server${NC}"
echo "=================================================="

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo -e "${RED}Error: Node.js is not installed${NC}"
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo -e "${RED}Error: npm is not installed${NC}"
    exit 1
fi

# Check if FFmpeg is installed
if ! command -v ffmpeg &> /dev/null; then
    echo -e "${RED}Error: FFmpeg is not installed${NC}"
    exit 1
fi

echo -e "${GREEN}✓ All dependencies found${NC}"
echo ""

# Setup backend
echo -e "${YELLOW}Setting up backend...${NC}"
cd backend

if [ ! -d "node_modules" ]; then
    echo "Installing Node dependencies..."
    npm install --silent
fi

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Backend setup complete${NC}"
else
    echo -e "${RED}✗ Failed to install backend dependencies${NC}"
    exit 1
fi

cd ..

# Setup frontend
echo ""
echo -e "${YELLOW}Setting up frontend...${NC}"
cd frontend

if [ ! -d "node_modules" ]; then
    echo "Installing Node dependencies..."
    npm install --silent
fi

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Frontend setup complete${NC}"
else
    echo -e "${RED}✗ Failed to install frontend dependencies${NC}"
    exit 1
fi

cd ..

echo ""
echo -e "${GREEN}=================================================="
echo "✓ Setup complete!"
echo "=================================================="
echo ""
echo "To start the development servers:"
echo ""
echo -e "${YELLOW}Terminal 1 - Backend:${NC}"
echo "cd backend"
echo "npm start"
echo "# or for development with auto-reload:"
echo "npm run dev"
echo ""
echo -e "${YELLOW}Terminal 2 - Frontend:${NC}"
echo "cd frontend"
echo "npm start"
echo ""
echo -e "${GREEN}Backend:  http://localhost:5000${NC}"
echo -e "${GREEN}Frontend: http://localhost:3000${NC}"
echo ""
