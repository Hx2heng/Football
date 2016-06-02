//created by hxz 
//qq397323988
//2015.4.1
(function($) {

    window.Game = function() {
        var source = []; //游戏资源, 存放图片和声音
        var c = $("#game-box"); //游戏容器
        var cxt = c.get(0).getContext("2d"); //构造画布
        var c_width, c_height; //画布的高和宽
        var $this  = this;
        this.handler = {}; //游戏程序
        c.fadeIn(200);
        //游戏配置
        var config = {
            "imageSrc": "images/", //图片url前缀
            "loadImg": ['bg.jpg', 'loading1.png', 'loading2.png', 'loading3.png', 'logo.png'], //等待动画图片资源
            "gameImg": ['b1.png', 'b1_2.png', 'b1_die1.png', 'ball_1.png', 'ball_2.png', 'man_1.png', 'man_2.png'], //游戏图片资源
            "gameTime": 30, //游戏时间
            "ballspeed": 10, //子弹速度
            "cartLoadedTime": 50, //填弹速度
            "isMobile": navigator.userAgent.match(/(iPhone|iPod|iPad|Android|BlackBerry|mobile)/) //是否手机 
        };
        //开始游戏
        this.gamestart = function(){
            main(); //执行main方法
        }
        //事件
        // load - 游戏加载完成
        // over - 游戏结束，返回游戏结果
        // goal - 进球  miss - 没进球 keep - 守门员接球 rebound -打到门框

        $this.on=function(type, fn) {//自定义事件
            if (typeof this.handler[type] == 'undefined') {
                this.handler[type] = [];
            }
            this.handler[type].push(fn);
            }
        $this.fire = function(type, data) {
            if (this.handler[type] instanceof Array) {
                var handler = this.handler[type];
                for (var i = 0; i < handler.length; i++) {
                    handler[i](data);
                }
            }
        }

        

        //新建图片函数

        function creatImg(src) {
            if (typeof source[src] != "undefined") {
                return source[src];
            }
            source[src] = new Image();
            source[src].src = config.imageSrc + src;
            return source[src];
        }

        //图片预加载函数

        function loadImage(images, callback) {
            var toLoadLength = images.length;
            var loadLength = 0;
            for (var i = toLoadLength; i--;) {
                var src = images[i];
                source[src] = new Image();
                source[src].onload = function() {
                    loadLength++;
                    if (toLoadLength == loadLength) {
                        callback();
                    }
                }
                source[src].src = config.imageSrc + src;
            }
        }

        //游戏主事件

        function main() {
            loadImage(config.loadImg, loading);

            resize();
            $(window).on("resize", resize);

            function resize() {
                var screenWidth = $(window).width();
                var screenHeight = $(window).height();
                c_height = screenHeight < 800 ? screenHeight : 800;
                c_width = screenWidth < 480 ? screenWidth : 480;
                c.attr({
                    height: c_height,
                    width: c_width
                }).offset({
                    top: (screenHeight - c_height) / 2
                });


            }
        }

        //等待事件

        function loading() {
            //等待时间
            var loadingTime = 0;

            //等待动画刷新事件
            var refresh = function() {
                drawBg();
                drawLogo();
                load();
                loadingTime++;
            }

            //设置背景

            function drawBg() {
                var bg_img = creatImg("bg.jpg");
                cxt.drawImage(bg_img, 0, 0,c_width, c_height);
            }

            //构造logo

            function drawLogo() {
                var logo_img = creatImg("logo.png");
                var logo_width = 150;
                var logo_height = 120;

                var x = (c_width - logo_width) / 2;
                var y = 100;
                cxt.drawImage(logo_img, x, y, logo_width, logo_height);
            }

            //等待动画

            function load() {
                if (loadingTime == 600) {
                    loadingTime = 0;
                }
                //loadingTime每隔200换一张图, 实现等待动画
                var pic = creatImg("loading" + (parseInt(loadingTime / 200) + 1) + ".png");
                var pic_width = pic.width;
                var pic_height = pic.height;

                var x = (c_width - pic_width) / 2;
                cxt.drawImage(pic, x, 220, pic_width, pic_height);
            }

            //开始动画
            //var loadingClock = setInterval(refresh, 1);
            var loadingClock = requestAnimationFrame(function() {
                refresh();
                loadingClock = requestAnimationFrame(arguments.callee);
            });
            loadImage(config.gameImg, function() {
                //clearInterval(loadingClock);
                cancelAnimationFrame(loadingClock);
                game();
                $this.fire('load');
            });

        }

        function game() {

            game = {};

            function getGameTime() {
                var nowTime = new Date().getTime();
                return parseInt((nowTime - game.beginTime) / 1000);
            }
            game.beginTime = new Date().getTime();
            game.time = 0;
            game.bgImg = creatImg("bg.jpg");
            game.score = 0;
            game.handler = {};
            game.timeLimit = config.gameTime; //时间限制
            game.refresh = function() {
                cxt.clearRect(-c_width * 4, -c_height * 4, c_width * 4, c_height * 4);
                game.time = getGameTime();
                game.timeLimit = config.gameTime - game.time;
                game.drawBg();
                game.GoalkeeperLife();
                game.ballsLife();
                game.refreshMessage();
                player.render();

                if (game.timeLimit <= 0) {
                   	game.over();
                }
            }
            game.over = function() {
                if (config.isMobile) {
                    c.get(0).removeEventListener("touchstart");
                } else {
                    c.off("click");
                }
                setTimeout(function(){cancelAnimationFrame(game.clock);},0);
                $this.fire('over',game.score);
                //c.remove();
            }
            game.clear = function() {
                cxt.clearRect(-c_width * 4, -c_height * 4, c_width * 4, c_height * 4);
                game.time = 0;
                game.score = 0;
                game.Goalkeepers.length = 0;
                player.balls.length = 0;
            }
            game.drawBg = function() {
                var bg_img_height = game.bgImg.height;
                var bg_img_width = game.bgImg.width;
                cxt.drawImage(game.bgImg, 0, 0, c.width(), c.height());

            }
            game.start = function() {
                game.clear();
                if (config.isMobile) {
                    c.get(0).addEventListener("touchstart", function(e) {
                        e.preventDefault();
                        var touch = e.targetTouches[0];
                        var x = touch.pageX - c.offset().left;
                        var y = touch.pageY - c.offset().top;
                        if (y < (c_height - 200)) {
                            player.rot = player.rotate(x, y);
                            if (player.cartLoaded) {
                                player.addballs(x, y, player.rot);
                                player.cartLoaded = false;
                            }
                        }
                    })
                } else {
                    c.on('click', function(e) {
                        var e = e ? e : window.event;
                        var x = e.clientX - c.offset().left;
                        var y = e.clientY - c.offset().top;
                        if (y < (c_height - 200)) {
                            player.rot = player.rotate(x, y);
                            if (player.cartLoaded) {
                                player.addballs(x, y, player.rot);
                                player.cartLoaded = false;
                            }
                        }
                    })
                }
                // game.clock = setInterval(function() {
                // 	game.refresh();
                // }, game.refreshInterval);

                game.clock = requestAnimationFrame(function() {
                    game.refresh();
                    game.clock = requestAnimationFrame(arguments.callee);
                }); 

                	
               
            };
            game.Goalkeepers = [];
            game.GoalkeepersNum = 0;
            game.createGoalkeepers = function() {
                if (game.GoalkeepersNum == 1) {
                    return;
                }
                game.Goalkeepers.push(new Goalkeeper(1));
                game.GoalkeepersNum++;
            }
            game.GoalkeeperLife = function() {
                game.createGoalkeepers();
                for (var i = 0; i < game.Goalkeepers.length; i++) {
                    game.Goalkeepers[i].init();
                    if (!game.Goalkeepers[i].alive) {
                        game.Goalkeepers.splice(i, 1);
                    }
                }

            }
            game.ballsLife = function() {
                for (var i = 0; i < player.balls.length; i++) {
                    if (!player.balls[i].alive) {
                        player.balls.splice(i, 1);
                    }
                }

            }
            game.refreshMessage = function() {
                var timeLimit = '00:' + timeset(game.timeLimit);
                if (timeLimit == '00:01') timeLimit = "Time up!";
                //
                function timeset(msd, hasZero) {
                    if (msd < 10) {
                        msd = '0' + msd;
                    }
                    return msd;
                }
                cxt.font = "40px Microsoft YaHei ";
                cxt.fillStyle = "white";
                cxt.fillText(game.score + ' 球', c_width - 30, c_height * .7);
                cxt.font = "italic 30px normal Microsoft YaHei ";
                cxt.fillStyle = "white";
                cxt.fillText(timeLimit, c_width - 30, c_height * .7 + 40);
                cxt.textAlign = "right";
            }
            

            var player = {};
            player.width = 100;
            player.height = 100;
            player.cartLoaded = true;
            player.cartLoadedTime = config.cartLoadedTime;
            player.man = {};
            player.man.x = c.width() / 10;
            player.man.y = c.height() / 2.3;
            player.man.width = c.width() / 2;
            player.man.height = c.height() / 2;
            player.man.model = creatImg("man_1.png");
            player.man.model2 = creatImg("man_2.png");
            player.rot = 0;
            player.balls = [];
            player.balls.width = c.width() * .15;
            player.balls.height = c.width() * .15;
            player.balls.x = c.width() * .43;
            player.balls.y = c.height() * .67;
            player.balls.model = creatImg("ball_1.png");
            player.render = function() {
                player.attack();
                if (player.cartLoaded) {
                    cxt.drawImage(player.balls.model, player.balls.x, player.balls.y, player.balls.width, player.balls.height);
                }
                // cxt.restore();
                if (player.cartLoaded) {
                    cxt.drawImage(player.man.model, player.man.x, player.man.y, player.man.width, player.man.height);
                } else {
                    player.loadballs();
                    cxt.drawImage(player.man.model2, player.man.x, player.man.y, player.man.width, player.man.height);
                }
            }
            player.addballs = function(x, y, rot) {
                player.balls.push(new balls(x, y, rot));
            }
            player.loadballs = function() {
                player.cartLoadedTime--;
                if (player.cartLoadedTime <= 0) {
                    player.cartLoaded = true;
                    player.cartLoadedTime = config.cartLoadedTime;
                }
            }
            player.attack = function() {
                if (player.balls[0]) {
                    for (var i = 0; i < player.balls.length; i++) {
                        var index = i;
                        player.balls[i].render();
                        if (player.balls[i].y < 0 || player.balls[i].y > c_height || player.balls[i].x < 0 || player.balls[i].x > c_width) {
                            player.balls.splice(index, 1);
                        }
                    }
                }
            }
            player.rotate = function(x, y) {
                var A = x - c.width() / 2;
                var B = c.height() - y - player.height / 2;
                var C = Math.sqrt(A * A + B * B);
                var angB = -Math.acos(A / C) / Math.PI * 180 - Math.PI * 86; //调整角度
                player.rot = angB;
                return player.rot;
            }
            var goal = {};
            goal.x = c.width() * .2;
            goal.y = c.height() * .1;
            goal.width = c.width() * .6;
            goal.height = c.height() * .1;


            function balls(x, y, rot) {
                this.height = player.balls.height;
                this.width = player.balls.width;
                this.x = c_width / 2;
                this.y = c_height / 1.4;
                this.rot = rot;
                this.ry = -player.balls.height / 2;
                this.ex = x;
                this.ey = y;
                this.vxy = -config.ballspeed;
                this.distance = Math.sqrt((this.ex - this.x) * (this.ex - this.x) + (this.ey - this.y) * (this.ey - this.y));
                this.px = (this.ex - this.x) / this.distance;
                this.py = (this.ey - this.y) / this.distance;
                this.vx = (-this.vxy) * this.px;
                this.vy = (-this.vxy) * this.py;
                this.model = creatImg("ball_1.png");
                this.alive = true;
            }
            balls.prototype = {
                render: function() {
                    var _this = this;
                    this.hitEle();
                    cxt.drawImage(this.model, _this.x - _this.width / 2, _this.y - _this.height / 2, _this.width, _this.height);
                    cxt.save();
                    _this.move();
                    cxt.translate(c_width / 2, c_height - player.height / 2);
                    cxt.rotate(_this.rot * Math.PI / 180);
                    //cxt.drawImage(creatImg(game.time % 30 > 15 ? "ball_1.png" : "ball_2.png"), -player.balls.width / 2, _this.ry, _this.width, _this.height);
                    cxt.restore();
                },
                move: function() {
                    this.ry += this.vxy;
                    this.y += this.vy;
                    this.x += this.vx;
                    this.width -= .8;
                    this.height -= .8;
                },
                hitEle: function() {
                    var Cr = this.width / 2;
                    for (var i = 0; i < game.Goalkeepers.length; i++) {
                        var Br = game.Goalkeepers[i].width / 2;
                        var Bx = game.Goalkeepers[i].x + Br;
                        var By = game.Goalkeepers[i].y + Br;
                        var distance = Math.sqrt((this.x - Bx) * (this.x - Bx) + (this.y - By) * (this.y - By));
                        if ((Cr + Br) > distance) {
                            game.Goalkeepers[i].byAttack();
                            this.alive = false;
                            $this.fire('keep');
                        }
                    }
                    if ((goal.x + goal.width) > this.x && this.y < (goal.y + goal.height) && this.x > goal.x) {
                        this.alive = false;
                        game.score++;
                        $this.fire('goal');
                    }
                    else if (
                        ((this.x > 40 && this.x < (goal.x - 20)) ||
                            (this.x > (goal.x + goal.width + 20) && this.x < (c.width() - 20))) && (this.y < (goal.y + goal.height + 20))
                    ) {
                        this.back();
                        $this.fire('rebound');
                    }
                    else if(this.x<+10||this.x>(c.width()-10)){
                        $this.fire('miss');
                    }
                },
                back: function() {
                    this.vy = -this.vy;
                    this.vx = this.vx * 2;
                }
            }

            function Goalkeeper(type) {
                this.type = type;
                this.x = c.width() * .5;
                this.y = c.height() * .2;
                this.vx = 2;
                this.vy = 2;
                this.speedX = 4;
                this.speedY = 1;
                this.showTime = 0;
                this.lifeTime;
                this.dieTime = 50;
                this.byAttackTime = 0;
                this.alive = true;
                var dieSpeed = 20; //死亡动画播放速度


                this.model = creatImg("b" + this.type + ".png");
                this.hurtmodel = creatImg("b" + this.type + "_die1.png");
                this.width = c_width / 3;
                this.height = c_height / 4.5;

            };
            Goalkeeper.prototype = {
                    init: function() {
                        var _this = this;
                        this.move();
                        //this.fillOut();
                        this.byAttackTime--;
                        this.showTime++;

                        if (this.byAttackTime > 0) {
                            cxt.drawImage(this.hurtmodel, _this.x, _this.y, _this.width, _this.height);
                        } else {
                            cxt.drawImage(creatImg(game.time % 2 > 0 ? "b1.png" : "b1_2.png"), _this.x, _this.y, _this.width, _this.height);

                        }
                    },
                    move: function() {
                        if (this.x < 0 || this.x > c_width - this.width) {
                            this.speedX = -this.speedX;
                            if (this.x < 0) {
                                this.x = 0;
                            } else if (this.x > c_width - this.width) {
                                this.x = c_width - this.width;
                            }
                        }
                        if (this.y > c_height / 5 || this.y < c_height * 0.09) {
                            this.speedY = -this.speedY;
                            if (this.y > c_height / 5) {
                                this.y = c_height / 5;
                            } else if (this.y < c_height * 0.09) {
                                this.y = c_height * 0.09;
                            }
                        }
                        if (player.cartLoadedTime != config.cartLoadedTime) {
                            this.x += this.speedX * this.vx;
                            this.y += this.speedY * this.vy;
                        } else {
                            this.x += this.speedX;
                            this.y += this.speedY;
                        }

                    },
                    fillOut: function() {

                        if (this.width >= (this.model.width / 2) && this.height >= (this.model.height / 2)) {
                            this.width = this.model.width / 2;
                            this.height = this.model.height / 2;
                        } else {
                            this.x -= 0.5;
                            this.y -= 0.5;
                            this.width++;
                            this.height++;
                        }
                    },
                    byAttack: function() {
                        //this.hp--;
                        this.byAttackTime = 10;
                        this.showTime = 0;
                    },
                    die: function() {

                        this.dieTime--;
                        if (this.dieTime < 8) {
                            this.model = creatImg("b" + this.type + "_die1.png");;
                        }
                        if (this.dieTime < 5) {
                            this.model = creatImg("b" + this.type + "_die2.png");;
                        }
                        if (this.dieTime == 0) {
                            this.alive = false;
                        }

                    },
                }
            game.start();
                //范围随机函数

            function rd(n, m) {
                var c = m - n + 1;
                return Math.floor(Math.random() * c + n);
            }
            return game;
        }


    }


})(jQuery)
