@echo off
echo 添加修改内容到暂存区...
git add .
echo 输入提交说明：
set /p msg=Commit message: 
git commit -m "%msg%"
echo 正在推送到远程仓库...
git push origin master
pause
