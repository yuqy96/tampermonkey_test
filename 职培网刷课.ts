// ==UserScript==
// @name         职培云(pushplus版)
// @version      1.0
// @description  自动播放课程选中视频到结尾所有视频，并提示所需时间。
// @author       ...
// @match        *://px.class.com.cn/*
// @grant        GM_xmlhttpRequest
// ==/UserScript==

// push plus  token   从https://pushplus.hxtrip.com/拿
const ACCESS_TOKEN = '';
// 职培网uid。解码二维码里面拿
const U_GUID = ''

// 50行可修改勿扰时间

function sendPushPlus(value) {
    console.log('准备发消息！')
    GM_xmlhttpRequest({
        method: "get",
        url: `http://pushplus.hxtrip.com/send?token=${ACCESS_TOKEN}&title=${encodeURIComponent(value.title)}&content=${encodeURIComponent(value.content)}&template=html`,
        onload: (res) => {
            if (res.status == 200) {
                console.log('发送成功');
            } else {
                console.log(`发送失败${JSON.stringify(res)}`);
                sendPushPlus(value);
            }
        },
        onerror: (e) => {
            console.log(`发送失败${JSON.stringify(e)}`);
            sendPushPlus(value);
        }
    });
}


(function() {
    if (location.pathname === '/player/index/photo') {
        console.log('人脸识别页');
        let isRemind = false;
        setInterval(function() {
            const signPhotoOk = document.getElementById('signPhotoOk');
            const reload = document.getElementsByClassName('reload')[0];
            const gotoClass = document.getElementsByClassName('btn btn-outline-primary aBtn26')[0];
            // 重置过期时间，使永不过期
            // window.unsafeWindow.expiryTime = 9999;
            // 1-9点不响应
            const date = new Date();
            if (date.getHours() >= 1 && date.getHours() < 9) return;
            if (reload != null && reload.style['display'] !== 'none') {
                console.log('验证码过期');
                const to_click = new MouseEvent("click");
                reload.dispatchEvent(to_click);
                isRemind = false;
            }
            else if (signPhotoOk != null && signPhotoOk.style['display'] === 'none') {
                console.log('需要扫描，发送消息', isRemind)
                if (!isRemind) {
                    const qrCode = document.getElementById('qrCode');
                    const queryList = qrCode.src.split('?')[1].split('&');
                    let queryMap = {}
                    queryList.forEach(q => {
                        const keyValue = q.split('=');
                        queryMap[keyValue[0]] = keyValue[1];
                    })
                    const url = `http://www-m.ataclass.cn/cert/study-photo?uGuid=${U_GUID}&sGuid=${queryMap['sGuid']}`
                    sendPushPlus({
                        "title": `职培网提示`,
                        "content": `【提示】快去人脸识别!!<br/>微信打开下列url：<a href='${url}'>${url}</a>`,
                    });
                    isRemind = true;
                }
            }
            else if (gotoClass != null) {
                console.log('需要返回课程页');
                const to_click = new MouseEvent("click");
                gotoClass.dispatchEvent(to_click);
            }
            else {
                console.log('扫码成功');
                const to_click = new MouseEvent("click");
                const back_btn = document.getElementsByTagName("a");
                // 自动点击继续按钮
                back_btn[0].dispatchEvent(to_click);
            }
        }, 3000);
    }
    else if (location.pathname === '/study/myclass/index') {
        console.log('课程列表页')
        let isRemind = false;
        setInterval(function() {
            const signPage = document.getElementsByClassName('sign-page');
            if (signPage && signPage[0]) {
                // 需要登录
                console.log('需要登录');
                const signImg = document.getElementById('signImg');
                const queryList = signImg.src.split('?')[1].split('&');
                let queryMap = {}
                queryList.forEach(q => {
                    const keyValue = q.split('=');
                    queryMap[keyValue[0]] = keyValue[1];
                })
                const url = `http://www-m.ataclass.cn/cert/sign?userGuid=${U_GUID}&classGuid=${queryMap['cguid']}`
                if (!isRemind) {
                    sendPushPlus({
                        "title": `职培网提示`,
                        "content": `【提示】快去登录!!  微信打开下列url：<a href='${url}'>${url}</a>`
                    });
                    isRemind = true;
                }
            } else {
                console.log('尝试进入未做课程');
                // 模拟鼠标点击
                const to_click = new MouseEvent("click");
                const video_list = document.getElementsByClassName("class-item unfinished");
                if (video_list[0] != null) {
                    const study_btn = video_list[0].getElementsByClassName("btn btn-outline-primary toStudy aBtn24");
                    const nextTitle = study_btn[0].parentNode.parentNode.querySelector('.title');
                    if (nextTitle) {
                        sendPushPlus({
                            "title": `职培网提示`,
                            "content": `【提示】开始学习：${nextTitle.innerText}!! `
                        });
                    }
                    study_btn[0].dispatchEvent(to_click);
                }

            }
        }, 3000);
    }
    else if (location.pathname === '/player/study/index') {
        console.log('播放器页');
        setInterval(function() {
            console.log('检测完成度');
            // 模拟鼠标点击
            const to_click = new MouseEvent("click");
            // 点击我已学完
            const get_btn = document.getElementById("btn_submit");
            get_btn.dispatchEvent(to_click);
            // 延时2秒执行; 如果未学完, 关闭剩余时间弹窗
            const block_btn = document.getElementById("vue_dialog_sub_my").style;
            setTimeout(function(){
                const play_btn = document.getElementById("d_sub_confirm_my");
                if (block_btn['display'] == "block") {
                    play_btn.dispatchEvent(to_click);
                }
            }, 2000)
            // 获取已学习时长和课程总时长
            const now = document.getElementById("learnedStr").innerText;
            const finish = document.getElementById("durationStr").innerText;
            // 返回课程主页
            const back_btn = document.getElementsByTagName("a");
            const btn_submit = document.getElementById('btn_submit');
            // 如果已学习=总时长, 点击返回课程主页
            if (now >= finish || (btn_submit != null && btn_submit.disabled && block_btn['display'] == 'block')) {
                back_btn[0].dispatchEvent(to_click);
            };
        }, 30000);
    }
    else if (document.title === '404' || document.title === '500') {
        location.pathname = '/study/myclass/index'
    }
})();
