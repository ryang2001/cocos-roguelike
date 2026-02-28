@echo off
echo ========================================
echo 清理 Cocos Creator 缓存
echo ========================================
echo.

REM 检查是否在正确的目录
if not exist "assets\scripts" (
    echo 错误: 请在项目根目录运行此脚本
    pause
    exit /b 1
)

echo 正在删除 temp 目录...
if exist "temp" (
    rmdir /s /q "temp"
    echo   [完成] temp
) else (
    echo   [跳过] temp 不存在
)

echo 正在删除 library 目录...
if exist "library" (
    rmdir /s /q "library"
    echo   [完成] library
) else (
    echo   [跳过] library 不存在
)

echo 正在删除 local 目录...
if exist "local" (
    rmdir /s /q "local"
    echo   [完成] local
) else (
    echo   [跳过] local 不存在
)

echo.
echo ========================================
echo 缓存清理完成!
echo ========================================
echo.
echo 请按以下步骤操作:
echo 1. 完全关闭 Cocos Creator
echo 2. 重新打开项目
echo 3. 等待完整编译
echo.
pause
