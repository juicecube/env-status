# curl -o- https://raw.githubusercontent.com/juicecube/env-status/master/last-commit.sh | bash

git show --stat --format='{"commit": "%h", "author": "%an", "branch": "%d"}|||' > last-commit.txt
