@echo off
echo 正在为其他项目创建分支...

REM 创建project-manager分支
git checkout --orphan project-manager
git rm -rf . 2>nul
echo # 项目管理工具 > README.md
echo. >> README.md
echo 这是项目管理工具分支。 >> README.md
echo. >> README.md
echo ## 开发状态 >> README.md
echo 项目准备中，等待开发。 >> README.md
git add README.md
git commit -m "初始化项目管理工具分支"

REM 创建public-tools分支
git checkout --orphan public-tools
git rm -rf . 2>nul
echo # 公共工具集合 > README.md
echo. >> README.md
echo 这是公共工具集合分支。 >> README.md
echo. >> README.md
echo ## 开发状态 >> README.md
echo 项目准备中，等待开发。 >> README.md
git add README.md
git commit -m "初始化公共工具分支"

REM 创建nodemind分支
git checkout --orphan nodemind
git rm -rf . 2>nul
echo # Node思维导图项目 > README.md
echo. >> README.md
echo 这是Node思维导图项目分支。 >> README.md
echo. >> README.md
echo ## 开发状态 >> README.md
echo 项目准备中，等待开发。 >> README.md
git add README.md
git commit -m "初始化Node思维导图项目分支"

REM 创建local-note-saver-tool分支
git checkout --orphan local-note-saver-tool
git rm -rf . 2>nul
echo # 本地笔记保存工具 > README.md
echo. >> README.md
echo 这是本地笔记保存工具分支。 >> README.md
echo. >> README.md
echo ## 开发状态 >> README.md
echo 项目准备中，等待开发。 >> README.md
git add README.md
git commit -m "初始化本地笔记保存工具分支"

REM 回到master分支
git checkout master

echo 所有项目分支创建完成！
echo.
echo 可用分支：
git branch -a

pause 