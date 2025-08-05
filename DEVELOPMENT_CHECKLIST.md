# Development Checklist

## Before Starting Work
- [ ] Check git status: `./dev-save.sh status`
- [ ] Create feature branch if working on major changes: `git checkout -b feature/description`
- [ ] Ensure you're on the latest version: `git pull origin master`

## During Development
- [ ] Save work every 15-30 minutes: `./dev-save.sh save`
- [ ] Test changes frequently
- [ ] Commit meaningful changes with descriptive messages
- [ ] Keep commits atomic (one logical change per commit)

## Before Taking Breaks
- [ ] Save current work: `./dev-save.sh save`
- [ ] Check git status: `./dev-save.sh status`
- [ ] Consider pushing to remote: `git push origin master`

## Before Major Changes
- [ ] Create backup: `./dev-save.sh backup`
- [ ] Create feature branch: `git checkout -b feature/major-change`
- [ ] Document what you're about to change

## If Something Goes Wrong
- [ ] Don't panic! Check recent commits: `git log --oneline -10`
- [ ] Look for auto-saves in git history
- [ ] Use `git stash` to temporarily save uncommitted changes
- [ ] Use `git reset --hard HEAD~1` to undo last commit (if needed)
- [ ] Use `git checkout -- filename` to restore specific files

## Best Practices
- [ ] Always commit before switching branches
- [ ] Use descriptive commit messages
- [ ] Test your changes before committing
- [ ] Keep a backup of important work
- [ ] Use the dev-save.sh script for quick saves

## Emergency Recovery
If you lose work:
1. Check git reflog: `git reflog`
2. Look for recent commits: `git log --oneline -20`
3. Check for stashed changes: `git stash list`
4. Look for auto-saves in commit history
5. Check your IDE's local history (if available)

## Quick Commands
```bash
# Quick save
./dev-save.sh save

# Check status
./dev-save.sh status

# Start development
./dev-save.sh start

# Clean and restart
./dev-save.sh clean
``` 