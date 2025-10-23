param(
    [Parameter(Mandatory=$true)]
    [string]$RepoUrl
)

# Usage: .\create_github_repo.ps1 -RepoUrl "https://github.com/username/reponame.git"
Write-Host "Adding remote origin $RepoUrl"
git remote add origin $RepoUrl
Write-Host "Creating main branch and pushing"
git branch -M main
git push -u origin main
Write-Host "Done. Repository pushed to $RepoUrl"