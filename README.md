# traffic-miniprogram — 商家 & 业务员小程序

基于 UniApp（HBuilderX）开发的微信小程序，包含商家端和业务员端两个角色。

---

## 一、环境要求

| 工具 | 说明 |
|------|------|
| HBuilderX | 4.0+，[下载地址](https://www.dcloud.io/hbuilderx.html) |
| 微信开发者工具 | 最新版，[下载地址](https://developers.weixin.qq.com/miniprogram/dev/devtools/download.html) |
| 后端服务 | 需要先启动 traffic-backend |

---

## 二、配置后端地址（必须修改）

打开文件 `traffic-miniprogram/utils/request.js`，将 `BASE_URL` 改成后端服务器的局域网 IP：

```js
// 注释掉 localhost，使用局域网 IP（手机必须和电脑在同一个 WiFi 下）
//export const BASE_URL = 'http://localhost:8080'
export const BASE_URL = 'http://192.168.x.x:8080'  // ← 改成你的电脑 IP
```

**如何查看本机局域网 IP：**
- macOS：`System Preferences → Network` 或终端执行 `ipconfig getifaddr en0`
- Windows：命令提示符执行 `ipconfig`，找到"IPv4 地址"

> ⚠️ 手机必须和运行后端的电脑连同一个 WiFi，否则无法访问。

---

## 三、用 HBuilderX 打开并运行

1. 打开 HBuilderX
2. 菜单 → **文件** → **导入** → **从本地目录导入**，选择 `traffic-miniprogram/traffic-miniprogram` 文件夹
3. 打开后，菜单 → **运行** → **运行到小程序模拟器** → **微信开发者工具**

> 第一次运行会自动唤起微信开发者工具，需要提前安装并登录。

---

## 四、在手机上测试

1. 在微信开发者工具中，点击右上角 **预览**
2. 用微信扫描生成的二维码
3. 在开发者工具 **详情** → **本地设置** 中，勾选 **不校验合法域名**，否则手机可能无法访问局域网接口

---

## 五、测试账号

运行 `traffic-backend/sql/seed_salesman.sql` 和 `seed_test_data.sql` 后可用以下账号登录：

| 角色 | 手机号 | 密码 |
|------|--------|------|
| 商家 | 根据 seed_test_data.sql 中的数据 | 123456 |
| 业务员 | 13800001111 | 123456 |

> 商家账号需要先由管理员在后台**审批通过**后才能登录。审批路径：后台管理 → 商家管理 → 找到对应商家 → 审批通过。

---

## 六、功能说明

### 商家端
- 今日客流看板（进店人数、当前在店、平均停留、女性占比）
- 客流趋势图（分钟/小时/天/周/月粒度）
- 停留时长分析
- 用户画像
- AI 经营建议（套餐不同功能不同）
- 我的：切换门店、修改密码、套餐升级

### 业务员端
- 商家跟进列表（新增商家、更新状态、历史记录、图片上传）
- 营销素材库
- 佣金提现申请
- 我的：个人信息、佣金明细

---

## 七、常见问题

**Q：手机上接口请求失败 / 网络错误**
A：
1. 确认 `BASE_URL` 填写的是局域网 IP（不是 localhost）
2. 确认手机和电脑在同一个 WiFi
3. 确认后端服务正在运行（访问 `http://192.168.x.x:8080` 在手机浏览器可以打开）
4. 微信开发者工具勾选"不校验合法域名"

**Q：图片上传后手机上显示不出来**
A：图片 URL 依赖 `BASE_URL` 配置，确保填写的是局域网 IP 而非 localhost。

**Q：商家登录后提示密码错误**
A：确认该商家在后台已经被审批通过（状态为"正常"），默认密码是 `123456`。

**Q：HBuilderX 提示 appid 未配置**
A：打开 `manifest.json`，在"微信小程序"一栏填入你自己的微信小程序 AppID（在[微信公众平台](https://mp.weixin.qq.com)注册获取），测试时也可以在微信开发者工具中使用测试号。
