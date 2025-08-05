#!/bin/bash

# Development helper script for Dagster Mobile
# Usage: ./dev-save.sh [command]

case "$1" in
  "save")
    echo "🔄 Saving current work..."
    git add .
    git commit -m "WIP: $(date '+%Y-%m-%d %H:%M:%S') - Auto-save"
    echo "✅ Work saved!"
    ;;
  "status")
    echo "📊 Git status:"
    git status --short
    echo ""
    echo "📝 Recent commits:"
    git log --oneline -5
    ;;
  "backup")
    echo "💾 Creating backup..."
    git add .
    git commit -m "BACKUP: $(date '+%Y-%m-%d %H:%M:%S') - Manual backup"
    echo "✅ Backup created!"
    ;;
  "start")
    echo "🚀 Starting development server..."
    npx expo start --go --port 8082 --clear
    ;;
  "build")
    echo "🏗️ Building for development..."
    npx expo run:android
    ;;
  "clean")
    echo "🧹 Cleaning cache..."
    rm -rf node_modules/.cache
    rm -rf .expo
    npx expo start --clear
    ;;
  *)
    echo "📋 Available commands:"
    echo "  ./dev-save.sh save    - Auto-save current work"
    echo "  ./dev-save.sh status  - Show git status and recent commits"
    echo "  ./dev-save.sh backup  - Create manual backup"
    echo "  ./dev-save.sh start   - Start development server"
    echo "  ./dev-save.sh build   - Build for development"
    echo "  ./dev-save.sh clean   - Clean cache and restart"
    ;;
esac 