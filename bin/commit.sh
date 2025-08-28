#!/bin/bash

# Git commit script
echo "🚀 Git Commit Helper"
echo "===================="

# Check if we're in a git repository
if ! git rev-parse --git-dir > /dev/null 2>&1; then
    echo "❌ Error: Not in a git repository"
    exit 1
fi

# Check for changes
if git diff --quiet && git diff --cached --quiet; then
    echo "ℹ️  No changes to commit"
    exit 0
fi

# Show current status
echo "📋 Current status:"
git status --short

echo ""
echo "💬 Enter your commit message:"
read -r commit_message

# Check if commit message is empty
if [ -z "$commit_message" ]; then
    echo "❌ Error: Commit message cannot be empty"
    exit 1
fi

# Add all changes
echo "📦 Adding all changes..."
git add .

# Commit changes
echo "💾 Committing changes..."
git commit -m "$commit_message"

# Push to remote
echo "🚀 Pushing to remote..."
git push

echo "✅ Done! Changes committed and pushed successfully."