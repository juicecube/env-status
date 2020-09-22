# curl -o- https://raw.githubusercontent.com/juicecube/env-status/master/env-build-validate.sh | bash

branch=$BRANCH_NAME
env=$NODE_ENV
if [ -z $env ]
then
  env=$front_env
fi

echo "Build $branch branch in $env environment."

if [[ $branch != "master" && ! $branch =~ sprint/. && ! $branch =~ feat/. && ! $branch =~ fix/. && ! $branch =~ hotfix/. ]]
then
  echo "!!! invalid branch name !!!"
  exit 1
fi

if [[ $env = "production" || $env = "staging" || $env = "test" ]]
then
  if [[ $branch != "master" && ! $branch =~ sprint/. && ! $branch =~ hotfix/. ]]
  then
    echo "!!! only master, sprint and hotfix branches can be built in production, staging and test environment !!!"
    exit 2
  fi
fi
