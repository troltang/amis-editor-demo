@echo off
echo ����޸����ݵ��ݴ���...
git add .
echo �����ύ˵����
set /p msg=Commit message: 
git commit -m "%msg%"
echo �������͵�Զ�ֿ̲�...
git push origin master
pause
