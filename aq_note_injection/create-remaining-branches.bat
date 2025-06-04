@echo off
echo 正在创建剩余的项目分支...

REM 创建nodemind分支
git checkout master
git checkout --orphan nodemind
git rm -rf .
robocopy nodemind . /E
git add .
git commit -m "添加nodemind项目到分支"

REM 创建public-tools分支
git checkout master
git checkout --orphan public-tools
git rm -rf .
robocopy public-tools . /E
git add .
git commit -m "添加public-tools项目到分支"

REM 创建local-note-saver-tool分支
git checkout master
git checkout --orphan local-note-saver-tool
git rm -rf .
robocopy local-note-saver-tool . /E
git add .
git commit -m "添加local-note-saver-tool项目到分支"

echo 所有分支创建完成！
git checkout master
git branch -a 