# curl -o- https://raw.githubusercontent.com/webyom/env-status/master/last-commit.sh | bash

git show --stat --format='{"commit": "%h", "author": "%an", "date": "%aD", "branch": "%D"}|||' > last-commit.txt
