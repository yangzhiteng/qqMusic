/**
 * Created by yang_zhiteng on 2017/1/5.
 */
/*REM处理*/
~function () {
    var winW = document.documentElement.clientWidth,
    //设计稿的高度
        desW = 640,
    //当前设计稿的宽度
        htmlFont = winW / desW * 100;
    //当屏幕的宽度大于设计稿的宽度时,让音乐区最大640px即可
    if (winW >= desW) {
        $('.musicBox').css({
            width: desW,
            margin: '0 auto'
        });
        window.htmlFont = 100;
        return
    }
    window.htmlFont = htmlFont;
    document.documentElement.style.fontSize = htmlFont + 'px';
}();
//计算main区域的高度
~function () {
    var winH = document.documentElement.clientHeight,
        headerH = $('.header')[0].offsetHeight,
        footerH = $('.footer')[0].offsetHeight;
    $('.main').css('height', winH - headerH - footerH - htmlFont * .8)

}();
////显示总时间
//$duration.html(formatTime(musicAudio.duration))
/*RENDER*/
var musicRender = (function () {
    var $musicPlan = $.Callbacks(),
        $lyric = $('.lyric'),
        $current = $('.current'),
        $duration = $('.duration'),
        $timeLineSpan = $('.timeLine>span');
    var musicAudio = $('#musicAudio')[0],
        $musicBtn = $('.musicBtn'),
        $musicBtnPlay = $musicBtn.eq(0),//eq是获取第一个,但是是获取集合中的某一个,但是获取的结果依然是JQ对象,而[N](.GET(N))获取的虽然也是第一个,但是结果是js对象
        $musicBtnPause = $musicBtn.eq(1);
    var musicTimer = null,
        step = 0;//记录当前展示到那句话,代表那一行,1代表第一行

    function formatTime(second) {
        var minute = Math.floor(second / 60);
        second = Math.floor(second - minute * 60);
        minute < 10 ? minute = '0' + minute : null;
        second < 10 ? second = '0' + second : null;
        return minute + ':' + second;
    }
//->数据绑定
    $musicPlan.add(function (data) {
        var str = '';
        $.each(data, function (index, item) {
            str += '<p data-minute="' + item.minute + '" data-second="' + item.second + '" id="lyric' + item.id + '">' + item.content + '</p>';
        });
        $lyric.html(str);
    });
    //控制音频的自动播放
    $musicPlan.add(function () {
        musicAudio.play();
        musicAudio.addEventListener('canplay', function () {
            //显示总时间
            $duration.html(formatTime(musicAudio.duration));
            $musicBtnPlay.css('display', 'none');
            $musicBtnPause.css('display', 'block')
        });
    });
    //控制播放和暂停
    $musicPlan.add(function () {
        //移动端可以使用click时间,但是在移动端click为代表单击操作,每一在每一次触发完成后都会等待300ms才能判断是够为单击(click事件300ms延迟的问题)

        $musicBtn.tap(function () {
            if (musicAudio.paused) {//暂停
                musicAudio.play();
                $musicBtnPlay.css('display', 'none');
                $musicBtnPause.css('display', 'block');
                return;
            }
            musicAudio.pause();
            $musicBtnPlay.css('display', 'block');
            $musicBtnPause.css('display', 'none')
        })
    });
    //追踪播放状态
    $musicPlan.add(function () {
        musicTimer = window.setInterval(function () {
            if (musicAudio.currentTime >= musicAudio.duration) {
                //播放完成
                window.clearInterval(musicTimer);
            }
            //获取当前已经播放的时间,控制显示当前播放的时间,而且还需要控制进度条的改变
            var timeR = formatTime(musicAudio.currentTime),
                minute = timeR.split(':')[0],
                second = timeR.split(':')[1];
            $current.html(formatTime(musicAudio.currentTime));
            $timeLineSpan.css('width', (musicAudio.currentTime / musicAudio.duration) * 100 + '%');
            //控制歌词对应:先控制对应的行有选中的样式
            //先控制对应的行有选中的样式,知道当前播放时间对应的分钟和秒
            var $lyricList = $lyric.children('p'),
                $tar = $lyricList.filter('[data-minute="' + minute + '"]').filter('[data-second="' + second + '"]');
            $tar.addClass('bg').siblings().removeClass('bg');
            var n = $tar.index();
            if (n >= 3) {//已经播放到第四条,这一条是歌词,我们开始向上移动.84rem
                $lyric.css('top', -.84 * (n - 2) + 'rem');
            }
        }, 1000)
    });
    return {
        init: function () {
            $.ajax({
                url: 'lyric.json',
                type: 'get',
                dataType: 'json',
                cache: false,
                success: function (result) {
                    if (result) {
                        result = result.lyric || '';
                        //->解析数据:替换内容各种的特殊字符
                        result = result.replace(/&#(\d+);/g, function () {
                            var num = Number(arguments[1]),
                                val = arguments[0];
                            switch (num) {
                                case 32:
                                    val = ' ';
                                    break;
                                case 40:
                                    val = '(';
                                    break;
                                case 41:
                                    val = ')';
                                    break;
                                case 45:
                                    val = '-';
                                    break;
                            }
                            return val;
                        });
                        //->捕获我们需要的数据
                        var data = [],
                            reg = /\[(\d{2})&#58;(\d{2})&#46;(?:\d{2})\]([^&#]+)(?:&#10;)?/g,
                            index = 0;
                        result.replace(reg, function () {
                            data.push({
                                id: ++index,
                                minute: arguments[1],
                                second: arguments[2],
                                content: arguments[3]
                            });
                        });

                        //->通知计划表中的方法依次执行
                        $musicPlan.fire(data);
                    }
                }
            });
        }
    }
})();
musicRender.init();