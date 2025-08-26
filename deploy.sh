#!/bin/bash

# TradieConnect Deployment Scripts
# Usage: ./deploy.sh [command]

case "$1" in
  "app")
    echo "🚀 Building and deploying React Native app..."
    npx expo export -p web
    mkdir -p website/app
    cp -r dist/* website/app/
    firebase deploy --only hosting
    echo "✅ App deployed to: https://tradie-mate-f852a.web.app/app"
    ;;
    
  "website")
    echo "🌐 Deploying static website..."
    firebase deploy --only hosting
    echo "✅ Website deployed to: https://tradie-mate-f852a.web.app"
    ;;
    
  "functions")
    echo "⚡ Deploying Firebase functions..."
    firebase deploy --only functions
    echo "✅ Functions deployed"
    ;;
    
  "all")
    echo "🚀 Full deployment: app + website + functions..."
    npx expo export -p web
    mkdir -p website/app
    cp -r dist/* website/app/
    firebase deploy
    echo "✅ Everything deployed!"
    ;;
    
  *)
    echo "📋 Available commands:"
    echo "  ./deploy.sh app       - Deploy React Native app only"
    echo "  ./deploy.sh website   - Deploy static website only"
    echo "  ./deploy.sh functions - Deploy Firebase functions only"
    echo "  ./deploy.sh all       - Deploy everything"
    ;;
esac