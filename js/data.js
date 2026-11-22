/* 展览文字与结构底稿
   文案依据《展览文案.md》，保留“据传 / 可能 / 一说”等限定语。
   本文件不发起任何网络请求。 */
window.EXHIBITION = {
  meta: {
    title: "草原与窑火",
    subtitle: "元代陶瓷中的蒙古生活习俗反映",
    en: "GRASSLAND & KILN FIRE",
    enSub: "Mongol Life in Yuan Ceramics",
    kicker: "A CERAMIC ARCHIVE / 六件器物 · 三个动作",
    oneLine: "器物的形状，往往先于纹饰，记录了一种生活方式。",
    duration: "完整参观约 8–10 分钟",
    actions: ["握", "围坐", "俯看"]
  },

  prologue: {
    id: "prologue",
    kicker: "序厅 / PROLOGUE",
    title: "从草原来",
    en: "FROM THE STEPPE",
    lead: "1271 年，忽必烈定国号为「元」。在此后不到一百年里，景德镇、磁州窑、龙泉窑等南北窑场，烧出了一批形制、尺寸与釉色都不同于前代的器物。",
    body: [
      "它们常被放在「蒙古统治」的框架里解释。但器物不会说话，能说话的是使用它的人。",
      "本展把六件器物放回三个动作：握、围坐、俯看。从一只手怎样端杯，到一圈人怎样围坐，再到一个人怎样低头看一件罐——草原生活就这样进入了陶瓷的形状。"
    ],
    closing: "先看一只手。它正要端起一只杯子。",
    timeline: [
      ["1206", "成吉思汗建立大蒙古国"],
      ["1271", "忽必烈定国号「元」"],
      ["1279", "元灭南宋，统一全国"],
      ["14 世纪", "景德镇青花、釉里红走向成熟；磁州窑白地黑花继续生产"],
      ["1368", "元亡"]
    ],
    note: "时间轴只作背景，不把王朝更替直接当作器物风格的因果解释。"
  },

  halls: [
    {
      id: "hall1",
      no: "第一展厅",
      title: "饮与携",
      sub: "手中的草原",
      en: "DRINKING & CARRYING",
      lead: "骑马的人，总要腾出一只手。缰绳占去一只手，另一只手要端杯、提壶。器的柄、流、腹，因此被重新设计。本厅两件器物，一件解决「怎么喝」，一件解决「怎么带」。",
      transition: "手放下，人坐下。桌子没有了，器物就变大了。",
      mood: {
        fog: 0x1b120b,
        exposure: 1.14,
        hemiSky: 0xffe1b8,
        hemiGround: 0x1a110a,
        hemiIntensity: 0.72,
        ambient: 0.16,
        key: 0xffcb92,
        keyIntensity: 2.7,
        rim: 0x9b6a3e,
        wall: 0x6a4c35,
        floor: 0x382417,
        ceiling: 0x24170e,
        panel: 0xe7d0b3
      }
    },
    {
      id: "hall2",
      no: "第二展厅",
      title: "食与礼",
      sub: "席上的秩序",
      en: "FOOD & RITUAL",
      lead: "蒙古人席地而坐。没有高桌，食物放在低处，人也围成一圈。器物的尺寸、重量与纹饰，随之下沉、放大、摊开。本厅两件器物：一件把桌面放大，一件把礼仪转起来。",
      transition: "吃完、喝完，东西放在哪里？视线又落在哪里？",
      mood: {
        fog: 0x181512,
        exposure: 1.08,
        hemiSky: 0xead7bd,
        hemiGround: 0x17130f,
        hemiIntensity: 0.6,
        ambient: 0.14,
        key: 0xffd4ae,
        keyIntensity: 2.35,
        rim: 0x7f6b55,
        wall: 0x5e5549,
        floor: 0x33291f,
        ceiling: 0x211b15,
        panel: 0xdfd0bc
      }
    },
    {
      id: "hall3",
      no: "第三展厅",
      title: "储与色",
      sub: "低处的目光",
      en: "STORAGE & COLOUR",
      lead: "器物放在低处，人的视线就跟着低下去。罐的肩、盘的沿、匜的口，成为最先被看见的部分。本厅两件器物：一件解决「怎么存」，一件解决「什么颜色」。",
      transition: "最后，我们把颜色也放回生活里。",
      mood: {
        fog: 0x0d0a08,
        exposure: 1.02,
        hemiSky: 0xd8c0a0,
        hemiGround: 0x120e0a,
        hemiIntensity: 0.48,
        ambient: 0.1,
        key: 0xffc287,
        keyIntensity: 2.8,
        rim: 0x8a5c34,
        wall: 0x3d3730,
        floor: 0x241d17,
        ceiling: 0x16110d,
        panel: 0xcdbca7
      }
    },
    {
      id: "tail",
      no: "尾厅",
      title: "器物是生活的注脚",
      sub: "尾厅",
      en: "CODA",
      lead: "六件器物，三种动作。手握住高足，是为了在马上喝一口酒；壶身变扁，是为了贴合身体；盘子变大，是为了让一圈人同时伸手；杯子能转，是为了在席间完成一个动作；罐放在低处，龙纹因此被俯看；蓝釉上的金线，则把颜色变成了一种态度。",
      transition: "",
      mood: {
        fog: 0x2b2117,
        exposure: 1.28,
        hemiSky: 0xffe7c9,
        hemiGround: 0x241a12,
        hemiIntensity: 0.88,
        ambient: 0.2,
        key: 0xffd9ad,
        keyIntensity: 2.2,
        rim: 0xb08050,
        wall: 0x87674b,
        floor: 0x3d2a1b,
        ceiling: 0x2a1e14,
        panel: 0xf0dcc2
      }
    }
  ],

  tail: {
    id: "tail",
    kicker: "尾厅 / CODA",
    title: "器物是生活的注脚",
    en: "OBJECTS AS FOOTNOTES",
    body: [
      "元代陶瓷中的蒙古因素，不是一条可以简单对应的公式。它藏在握持的高度、围坐的直径、放置的低处，也藏在蓝色与金色之间。",
      "六件器物，没有一件能单独证明「蒙古人就是这样生活的」。它们加在一起，才让我们看见一种姿势：一只手端杯，一圈人围坐，一个人低头看罐。"
    ],
    closing: "下一次看瓷器，先别急着看纹饰。先看它是被怎样拿着的。",
    question: "再看一件器物：它让你摆出了什么姿势？"
  },

  artifacts: [
    {
      id: "01",
      hall: "hall1",
      title: "元青花龙纹高足杯",
      short: "高足杯",
      alias: "俗称「马上杯」 · Stem Cup with Dragon Pursuing Flaming Jewel",
      en: "STEM CUP WITH DRAGON",
      collection: "克利夫兰艺术博物馆 1964.169",
      model: "stemCup",
      side: 1,
      z: 2.2,
      scale: 1.0,
      focusHeight: 1.14,
      wallKicker: "第一展厅 / 饮与携 · OBJECT 01",
      wallTitle: "一只手，先端起杯子",
      wallText: "细长的高足让一只手就能握住，杯腹贴近掌心。至于它是否真的被系在马鞍上，文献没有回答。",
      plaqueLine: "YUAN · JINGDEZHEN KILN · 1964.169",
      meta: [
        ["年代", "元（14 世纪）"],
        ["窑口", "江西景德镇窑"],
        ["收藏", "克利夫兰艺术博物馆 1964.169"],
        ["尺寸", "高 11.8 cm；口径 13.3 cm"],
        ["工艺", "瓷，青花，釉下钴蓝彩"]
      ],
      lead: "敞口，深腹，下承细长的竹节状高足。外壁以青花绘一条追逐火珠的龙，龙身随器腹转折，云气填满空隙。高足杯在元代大量出现，常被称作「马上杯」：细长的足部正好容一只手握住，杯腹贴近掌心。至于它是否真的被系挂在腰间或马鞍上，今天没有直接的图像证据；能确定的是，这只杯把「持握」放到了器形设计的中心。",
      focus: [
        {
          title: "竹节状高足",
          text: "足部做成竹节凸棱，既增加强度，也让手指有明确的着力点。握持时，拇指与食指卡在节间，杯子不易滑脱。"
        },
        {
          title: "龙追火珠",
          text: "龙身细长，龙头昂起，四肢张开，前方是一颗火珠。元代龙纹常见细颈、疏发、利爪的形态，生气外露，与明清龙纹的程式化面貌不同。"
        },
        {
          title: "青花",
          text: "钴蓝彩绘在釉下，罩透明釉后一次高温烧成。蓝色沉入釉层，历久不褪。青花在元代走向成熟并大规模生产，这只杯是其中一件普通而不普通的样本。"
        }
      ],
      boundary: "「马上杯」是后世俗称，不是元代的自称；「系挂于腰间或马鞍」为推测，未见元代文献直接记载。高足杯在宋代已经出现，元代是流行与变化，不是从无到有，更不是民族识别标志。",
      images: [
        {
          label: "全器",
          src: "assets/img/01_hero.jpg",
          alt: "元青花龙纹高足杯，克利夫兰艺术博物馆藏",
          caption: "元青花龙纹高足杯，克利夫兰艺术博物馆藏（1964.169）。图片：克利夫兰艺术博物馆，CC0。"
        },
        {
          label: "龙纹",
          src: "assets/img/01_detail_dragon.jpg",
          alt: "高足杯外壁龙纹细部",
          caption: "外壁龙纹细部。同一件器物，局部裁切。图片：克利夫兰艺术博物馆，CC0。"
        },
        {
          label: "高足",
          src: "assets/img/01_detail_stem.jpg",
          alt: "高足杯竹节状高足细部",
          caption: "竹节状高足与杯腹连接处。同一件器物，局部裁切。图片：克利夫兰艺术博物馆，CC0。"
        },
        {
          label: "同类器",
          src: "assets/img/01_variant_meiyue.jpg",
          alt: "元青花梅月纹竹节形高足瓷杯，同类器参考",
          caption: "同类器参考：景德镇窑青花梅月纹竹节形高足瓷杯，非本件文物。图片：白色瑰宝，CC BY-SA 4.0。"
        }
      ],
      hotspots: [
        {
          x: 50,
          y: 63,
          title: "龙身随器腹转折",
          text: "龙并不是平铺在杯身上的。它随着深腹的弧度起伏，云气填满空隙，让整圈纹饰没有明显的断点。"
        },
        {
          x: 50,
          y: 83,
          title: "竹节高足",
          text: "凸起的竹节既加固细长的足部，也给手指留下明确的着力点。"
        },
        {
          x: 68,
          y: 37,
          title: "釉下青花",
          text: "钴蓝画在釉下，罩透明釉后高温一次烧成。颜色沉在釉层里，不是浮在表面。"
        }
      ],
      hint: "拖动杯子旋转 · 点击右侧资料夹翻档案",
      audio: {
        src: "assets/audio/01_gallery_room_tone.m4a",
        label: "展厅底噪（合成）",
        note: "低音量的展厅空间感，不是现场录音。默认关闭，点击后播放。"
      },
      video: {
        src: "assets/media/01_stem_cup_pan.mp4",
        poster: "assets/media/01_video_poster.jpg",
        note: "8 秒 · 1280×720 · 静音 · 全器 → 龙纹 → 回到全器"
      },
      credits: "图片：克利夫兰艺术博物馆，CC0。同类梅月纹高足杯：白色瑰宝，CC BY-SA 4.0。"
    },

    {
      id: "02",
      hall: "hall1",
      title: "元青花凤首扁壶",
      short: "凤首扁壶",
      alias: "Phoenix-headed Ewer · 首都博物馆藏",
      en: "PHOENIX-HEADED EWER",
      collection: "首都博物馆藏",
      model: "phoenixEwer",
      side: -1,
      z: -4.6,
      scale: 1.12,
      focusHeight: 1.16,
      wallKicker: "第一展厅 / 饮与携 · OBJECT 02",
      wallTitle: "把壶压扁，贴身带走",
      wallText: "扁腹可能更贴合身体，重心也更低。凤首是流，凤尾是柄，壶腹是身体。这是功能推断，不是元人的自述。",
      plaqueLine: "YUAN · JINGDEZHEN KILN · CAPITAL MUSEUM",
      meta: [
        ["年代", "元"],
        ["窑口", "江西景德镇窑"],
        ["收藏", "首都博物馆藏"],
        ["尺寸", "高约 18.7 cm；口径约 4 cm（公开资料）"],
        ["工艺", "青花，模印贴塑与彩绘结合"]
      ],
      lead: "壶身扁圆，短颈，一侧是高昂的凤首流，另一侧是卷曲的凤尾柄，通体绘青花。扁腹的设计很实际：贴身携带时，壶体更服帖，重心也更低，颠簸中不易倾洒。凤首与凤尾把一只实用器变成了一只鸟——流是喙，柄是尾，壶腹是身体。把器皿做成动物形状的传统在中原很早就有了，元代工匠用青花把它重新画了一遍。",
      focus: [
        {
          title: "凤首流",
          text: "流口塑成凤喙，颈部扬起。倒酒时，酒液从喙尖流出；不使用时，凤首又成为整器的视觉焦点。"
        },
        {
          title: "扁圆腹",
          text: "腹径大于腹深，侧面看是一只扁壶。扁腹在背负或侧挂时更贴合身体，这是基于器形的功能推断，不是元人的自述。"
        },
        {
          title: "凤尾柄",
          text: "柄部卷曲上扬，既方便握持，也补足了「鸟」的轮廓。柄与流一前一后，让扁壶在视觉上保持平衡。"
        }
      ],
      boundary: "「贴合人体 / 马背」是功能推断，不要写成「为骑马专门设计」。凤鸟是中原传统题材，不能直接等同于「草原图腾」。扁壶在地中海、中亚、中国北方都有长期传统，并非蒙古人独有。首都博物馆藏品与伊犁州博物馆藏品是两件器，尺寸只适用于前者。",
      images: [
        {
          label: "全器",
          src: "assets/img/02_hero.jpg",
          alt: "元青花凤首扁壶，首都博物馆藏",
          caption: "元青花凤首扁壶，首都博物馆藏。图片：Augusthaiho，CC BY-SA 4.0。"
        },
        {
          label: "另一角度",
          src: "assets/img/02_alt.jpg",
          alt: "元青花凤首扁壶另一角度",
          caption: "同一件器物的另一角度。图片：Augusthaiho，CC BY-SA 4.0。"
        },
        {
          label: "凤首",
          src: "assets/img/02_detail_head.jpg",
          alt: "凤首流细部",
          caption: "凤首流细部。局部裁切。图片：Augusthaiho，CC BY-SA 4.0。"
        },
        {
          label: "纹饰",
          src: "assets/img/02_detail_wing.jpg",
          alt: "壶身青花纹饰细部",
          caption: "壶身青花纹饰细部。局部裁切。图片：Augusthaiho，CC BY-SA 4.0。"
        },
        {
          label: "同类器",
          src: "assets/img/02_context.jpg",
          alt: "新疆伊犁哈萨克自治州博物馆藏元青花凤首扁壶",
          caption: "同类器：新疆伊犁哈萨克自治州博物馆藏元青花凤首扁壶，非首都博物馆藏品。图片：HaziiDozen，CC BY-SA 4.0。"
        }
      ],
      hotspots: [
        {
          x: 35,
          y: 43,
          title: "凤首是流",
          text: "凤喙就是流口。倒酒时酒液从喙尖流出，不使用时，凤首成为整器的视觉焦点。"
        },
        {
          x: 55,
          y: 62,
          title: "扁腹贴向身体",
          text: "腹径大于腹深，侧面更薄。贴身携带时更服帖，重心也更低——这是功能推断，不是元人自述。"
        },
        {
          x: 73,
          y: 49,
          title: "凤尾是柄",
          text: "卷曲上扬的柄补足了鸟的轮廓，也让提握有了明确的位置。"
        }
      ],
      hint: "拖动壶身旋转 · 点击左侧资料夹翻档案",
      audio: {
        src: "assets/audio/01_gallery_room_tone.m4a",
        label: "展厅底噪（合成）",
        note: "与第一展厅共用一条低音量底噪。默认关闭，点击后播放。"
      },
      video: {
        src: "assets/media/02_phoenix_ewer_angles.mp4",
        poster: "assets/media/02_video_poster.jpg",
        note: "8 秒 · 1280×720 · 静音 · 多角度看流与柄"
      },
      credits: "图片：Augusthaiho，CC BY-SA 4.0。同类器：HaziiDozen，CC BY-SA 4.0。"
    },

    {
      id: "03",
      hall: "hall2",
      title: "元代青花折沿大盘",
      short: "折沿大盘",
      alias: "Large Dish · 松冈美术馆 / 上海博物馆同类器",
      en: "LARGE FOLIATED-RIM DISH",
      collection: "日本松冈美术馆藏（主图）",
      model: "dish",
      side: 1,
      z: -13.8,
      scale: 1.16,
      focusHeight: 1.22,
      wallKicker: "第二展厅 / 食与礼 · OBJECT 03",
      wallTitle: "把桌面放大",
      wallText: "口径可达四五十厘米。端起来需要两只手，放在地上或矮桌上，正好够一圈人同时取食。",
      plaqueLine: "YUAN · JINGDEZHEN KILN · 40–50 CM",
      meta: [
        ["年代", "元（14 世纪）"],
        ["窑口", "江西景德镇窑"],
        ["收藏", "日本松冈美术馆、上海博物馆等"],
        ["尺寸", "口径约 40–50 cm（类型范围）"],
        ["工艺", "青花，宽折沿，浅腹，胎体厚重"]
      ],
      lead: "宽平的折沿向外展开，浅腹，厚胎。这样的盘子口径可达四五十厘米，端起来需要两只手，放在地上或矮桌上，正好够一圈人同时取食。元代大型器物的增多，常被工艺美术史研究与蒙古贵族「嗜酒豪饮」的饮食习惯联系起来。教材里有一句谨慎的判断：「陶瓷器皿多大型的产品，可能与贵族统治者嗜酒豪饮的生活习惯有关。」这是相关性，不是因果证明。盘子不会记录菜单，但它的尺寸记录了一桌人怎么坐。",
      focus: [
        {
          title: "宽折沿",
          text: "折沿向外平展，扩大了盘面的使用面积，也让盘子在矮桌上更稳。沿面常绘一周连续纹饰，俯视时最先看到。"
        },
        {
          title: "盘心主纹",
          text: "盘心是主纹，沿面是辅纹。大尺寸给了画工更大的经营位置，纹饰层次因此比小器更复杂。本厅两件大盘的纹样分别是双凤缠枝菊与瓜竹葡萄，可见大型盘的题材并不限于龙与牡丹。"
        },
        {
          title: "厚胎",
          text: "大器在烧成中容易变形，胎体必须加厚。重量由此增加，也决定了它更适合固定放置，而不是频繁搬动。"
        }
      ],
      boundary: "教材原话是「嗜酒豪饮」，不是「大吃大喝」；引用时不要改词。「共食」是合理的场景推断，但不要写成「蒙古人只共食、不分餐」。本厅两件大盘都不是「海水龙纹」或「缠枝牡丹」那一件；口径 40–50 厘米是类型范围，不是每一件都这么大。",
      images: [
        {
          label: "全器",
          src: "assets/img/03_hero.jpg",
          alt: "元青花双凤缠枝菊纹大盘，日本松冈美术馆藏",
          caption: "元青花双凤缠枝菊纹大盘，日本松冈美术馆藏。图片：Daderot，公有领域。"
        },
        {
          label: "同类盘",
          src: "assets/img/03_comparison.jpg",
          alt: "元青花菱花口盘，上海博物馆藏",
          caption: "元青花菱花口盘（瓜、竹、葡萄纹），上海博物馆藏。同类大型盘，非同一件。图片：Wmpearl，公有领域。"
        },
        {
          label: "盘心",
          src: "assets/img/03_detail_center.jpg",
          alt: "大盘盘心纹饰细部",
          caption: "松冈美术馆大盘盘心细部。局部裁切，公有领域。"
        },
        {
          label: "沿口",
          src: "assets/img/03_detail_rim.jpg",
          alt: "大盘沿口纹饰细部",
          caption: "松冈美术馆大盘沿口细部。局部裁切，公有领域。"
        }
      ],
      hotspots: [
        {
          x: 50,
          y: 17,
          title: "宽折沿",
          text: "折沿向外平展，扩大盘面，也让盘子在矮桌上更稳。俯视时，最先看到的就是这一圈连续纹饰。"
        },
        {
          x: 50,
          y: 50,
          title: "盘心主纹",
          text: "盘心是主纹，沿面是辅纹。大尺寸给了画工更大的经营位置，纹饰层次比小器更复杂。"
        },
        {
          x: 50,
          y: 86,
          title: "厚胎与重量",
          text: "大器烧成时容易变形，胎体必须加厚。重量增加，也让它更适合固定放置，而不是频繁搬动。"
        }
      ],
      hint: "拖动盘子旋转 · 点击右侧资料夹翻档案",
      audio: {
        src: "assets/audio/02_kiln_fire.m4a",
        label: "窑火环境（合成）",
        note: "低音量的窑火与轻微爆裂声，不是现场录音。默认关闭，点击后播放。"
      },
      video: {
        src: "assets/media/03_large_dish_detail.mp4",
        poster: "assets/media/03_video_poster.jpg",
        note: "7 秒 · 1280×720 · 静音 · 从全器推向盘心"
      },
      credits: "图片：Daderot / 日本松冈美术馆，公有领域；Wmpearl / 上海博物馆，公有领域。"
    },

    {
      id: "04",
      hall: "hall2",
      title: "元釉里红彩斑堆塑螭纹高足转杯",
      short: "高足转杯",
      alias: "高安市博物馆藏 · 1980 年江西高安元代窖藏出土",
      en: "SPINNING STEM CUP",
      collection: "高安市博物馆藏",
      model: "spinningCup",
      side: -1,
      z: -20.2,
      scale: 1.06,
      focusHeight: 1.17,
      wallKicker: "第二展厅 / 食与礼 · OBJECT 04",
      wallTitle: "把礼仪转起来",
      wallText: "杯身与高足之间藏着一根活轴。转的是杯身，不是整只杯子。至于「杯纽朝向谁」，那是一则传说。",
      plaqueLine: "YUAN · GAO'AN MUSEUM · 1980 HOARD",
      meta: [
        ["年代", "元"],
        ["窑口", "江西景德镇窑"],
        ["收藏", "高安市博物馆藏"],
        ["出土", "1980 年，江西高安元代窖藏"],
        ["尺寸", "通高约 13 cm（公开资料，以馆方公布为准）"],
        ["工艺", "釉里红、堆塑、活轴旋转结构"]
      ],
      lead: "杯身与高足之间，藏着一根活轴。杯身可以 360 度转动，高足不动。外壁堆塑一条红色的螭龙，龙身凸起，釉里红的彩斑在龙身与杯壁之间流动。这件器物的关键不在纹饰，而在结构：它把「转」做进了瓷器。蒙古人席地而坐于毡帐之中，器物放在低处，转动杯身是一个自然的动作。至于「杯纽朝向谁，谁就是帐中最尊贵的客人」，这是一则流传很广的民间说法，目前没有元代文献可以直接印证。我们把它保留为「据传」，而不是结论。",
      focus: [
        {
          title: "活轴",
          text: "杯身与高足分段制作，以轴套接。转的是杯身，不是整只杯子。轴部是整件器物最脆弱、也最见工艺的地方。"
        },
        {
          title: "堆塑螭龙",
          text: "螭龙贴塑在杯壁外侧，龙首凸出，形成明确的视觉指向。它既是装饰，也是转动时最容易跟踪的标记。"
        },
        {
          title: "釉里红",
          text: "铜红料绘在釉下，高温还原气氛中呈色。元代釉里红烧成难度高，常见偏灰、偏暗的成品；红色越纯正，越难得。"
        }
      ],
      boundary: "「杯纽朝向谁，谁最尊贵」必须保留「据传」「一说」「民间传说」，未见元代文献。不要写成「转杯是蒙古包礼仪的标准器」——它是一件孤例性质的器物，不能代表所有蒙古宴饮。参考图是红白釉瓶，不是釉里红转杯；两者同属铜红呈色技术谱系，但不能说成同一品种。",
      images: [
        {
          label: "剖面示意",
          src: "assets/img/04_diagram_cross_section.png",
          alt: "高足转杯结构剖面示意图",
          caption: "高足转杯结构剖面示意。原创绘制，CC0，非实测比例。"
        },
        {
          label: "俯视旋转",
          src: "assets/img/04_diagram_rotation.png",
          alt: "高足转杯俯视旋转示意图",
          caption: "转杯俯视旋转示意。原创绘制，CC0，非实测比例。图中「据传」为限定语。"
        },
        {
          label: "参考器",
          src: "assets/img/04_reference.jpg",
          alt: "元红白釉瓶，内蒙古博物院藏，铜红呈色参考",
          caption: "同类铜红釉呈色参考：元红白釉瓶，内蒙古博物院藏，2003 年集宁路遗址出土。非本件转杯。图片：BabelStone，CC BY-SA 3.0。"
        },
        {
          label: "红釉细部",
          src: "assets/img/04_detail_red.jpg",
          alt: "参考器红釉彩斑细部",
          caption: "参考器红釉彩斑细部。局部裁切，CC BY-SA 3.0。非本件转杯。"
        }
      ],
      hotspots: [
        {
          x: 29,
          y: 34,
          title: "杯身可转",
          text: "杯身与高足分段制作，以活轴套接。转的是杯身，高足保持不动。"
        },
        {
          x: 29,
          y: 57,
          title: "活轴",
          text: "轴部藏在杯身与高足之间，是整件器物最脆弱、也最见工艺的地方。"
        },
        {
          x: 29,
          y: 76,
          title: "高足固定",
          text: "高足承重，不随杯身转动。器物的「动」与「静」被分成了两段。"
        }
      ],
      hint: "拖动杯身，让它转起来 · 高足不动",
      interaction: {
        type: "rotation",
        label: "转动杯身",
        note: "杯身转动，高足不动。停下的位置没有标准答案。「杯纽朝向谁」只是民间传说，未见元代文献。"
      },
      audio: {
        src: "assets/audio/02_kiln_fire.m4a",
        label: "窑火环境（合成）",
        note: "与第二展厅共用一条低音量窑火环境音。默认关闭，点击后播放。"
      },
      credits: "参考图：BabelStone，CC BY-SA 3.0。结构示意图：本次制作，CC0。"
    },

    {
      id: "05",
      hall: "hall3",
      title: "元磁州窑白地黑花龙凤纹罐",
      short: "磁州窑罐",
      alias: "Cizhou Ware Jar · 无锡博物院藏",
      en: "CIZHOU JAR WITH DRAGON AND PHOENIX",
      collection: "无锡博物院藏",
      model: "cizhouJar",
      side: 1,
      z: -29.6,
      scale: 1.16,
      focusHeight: 1.26,
      wallKicker: "第三展厅 / 储与色 · OBJECT 05",
      wallTitle: "把目光放低",
      wallText: "大口，鼓腹，白釉为地，黑彩绘龙凤。罐放在地面或矮桌上，视线自然落在肩部与上腹之间。",
      plaqueLine: "YUAN · CIZHOU KILN · WUXI MUSEUM",
      meta: [
        ["年代", "元"],
        ["窑口", "磁州窑系（北方）"],
        ["收藏", "无锡博物院藏"],
        ["尺寸", "以馆方公布为准"],
        ["工艺", "白地黑花，化妆土剔划彩绘"]
      ],
      lead: "大口，鼓腹，白釉为地，黑彩绘龙凤。磁州窑是北方最大的民窑体系，白地黑花是它最典型的装饰语言：先在胎上施一层白色化妆土，再用黑彩绘画，最后罩釉烧成。鼓腹适合储存，也适合放置在低处。蒙古人席地而坐，罐放在地面或矮桌上，视线自然落在肩部与上腹之间。工匠把主纹安排在这一带，让龙身横向展开——这是从观看方式出发的推测，不是元人留下的设计说明。",
      focus: [
        {
          title: "白地黑花",
          text: "白色化妆土与黑彩形成强烈对比，绘画性强，成本却低于青花。它面向的是广泛的民间市场，不是宫廷。"
        },
        {
          title: "龙凤组合",
          text: "龙与凤都是中原传统题材。元代磁州窑把两者放在同一件罐上，龙身矫健，凤尾舒展，画面饱满。不要把它直接解释成「草原图腾」。"
        },
        {
          title: "鼓腹与口沿",
          text: "大口便于取用与清洗，鼓腹提供容量。器形的每一处，都指向「储存」这个动作。"
        }
      ],
      boundary: "「储存马奶酒、奶茶」是功能推测，用「可能」。「俯视视角」是视觉分析，不是定论；不要写「纹饰专为俯视设计」。龙凤纹是中原传统题材，不要写成「蒙古图腾」。无锡博物院藏罐的尺寸未确认，展签不写具体数字。",
      images: [
        {
          label: "全器",
          src: "assets/img/05_hero.jpg",
          alt: "元磁州窑白地黑花龙凤纹罐，无锡博物院藏",
          caption: "元磁州窑白地黑花龙凤纹罐，无锡博物院藏。图片：猫猫的日记本，CC BY-SA 3.0。"
        },
        {
          label: "龙纹",
          src: "assets/img/05_detail_dragon.jpg",
          alt: "磁州窑罐龙纹细部",
          caption: "罐身龙纹细部。局部裁切。图片：猫猫的日记本，CC BY-SA 3.0。"
        },
        {
          label: "口沿",
          src: "assets/img/05_detail_rim.jpg",
          alt: "磁州窑罐口沿与肩部细部",
          caption: "口沿与肩部细部。局部裁切。图片：猫猫的日记本，CC BY-SA 3.0。"
        },
        {
          label: "同类器",
          src: "assets/img/05_comparison.jpg",
          alt: "元磁州窑龙纹罐，克利夫兰艺术博物馆藏",
          caption: "同类器比较：元磁州窑龙纹罐，克利夫兰艺术博物馆藏（1948.215），非同一件。图片：克利夫兰艺术博物馆，CC0。"
        }
      ],
      hotspots: [
        {
          x: 50,
          y: 22,
          title: "大口与肩部",
          text: "大口便于取用与清洗。放在低处时，肩部与上腹正好落在视线里。"
        },
        {
          x: 50,
          y: 51,
          title: "龙凤横向展开",
          text: "龙与凤都是中原传统题材。主纹沿鼓腹横向铺开，画面饱满，不是「草原图腾」。"
        },
        {
          x: 34,
          y: 42,
          title: "白地黑花",
          text: "白色化妆土与黑彩形成强对比，绘画性强，成本低于青花，面向广泛的民间市场。"
        }
      ],
      hint: "拖动罐身旋转 · 点击右侧资料夹翻档案",
      audio: {
        src: "assets/audio/03_grassland_wind.m4a",
        label: "草场风声（合成）",
        note: "低音量风声，不是现场录音。默认关闭，点击后播放。"
      },
      credits: "图片：猫猫的日记本，CC BY-SA 3.0。同类器：克利夫兰艺术博物馆，CC0。"
    },

    {
      id: "06",
      hall: "hall3",
      title: "元蓝釉描金匜",
      short: "蓝釉匜",
      alias: "Blue-glazed Yi with Gold · 故宫博物院藏",
      en: "BLUE-GLAZED YI WITH GOLD",
      collection: "故宫博物院藏",
      model: "blueYi",
      side: -1,
      z: -36.0,
      scale: 1.28,
      focusHeight: 1.12,
      wallKicker: "第三展厅 / 储与色 · OBJECT 06",
      wallTitle: "把颜色端上台面",
      wallText: "深蓝釉为底，金线沿着釉面走。蓝与金都不是单一原因：钴料、烧成技术、外来审美与宫廷趣味一起作用。",
      plaqueLine: "YUAN · JINGDEZHEN KILN · PALACE MUSEUM",
      meta: [
        ["年代", "元（中期）"],
        ["窑口", "江西景德镇窑"],
        ["收藏", "故宫博物院藏"],
        ["出土", "1964 年，河北保定元代窖藏"],
        ["尺寸", "高约 4.5 cm；口径约 11.5 cm（公开资料）"],
        ["工艺", "高温蓝釉、釉上描金、低温烘烧"]
      ],
      lead: "通体施深蓝釉，内壁用金彩描绘流云与折枝花。蓝是底，金是线；金线不覆盖器形，只沿着釉面走。匜的器形来自青铜盥洗器，一侧有流，用来倒水。元代瓷匜的具体用途尚有讨论，但它把「蓝」推到了主位。蓝色在蒙古文化中与「长生天」相连，白色象征纯洁与吉庆；元代蓝釉的兴起，同时受钴料供应、烧成技术与外来审美的影响。把一件蓝釉器完全解释成「长生天崇拜」，是把复杂的问题说简单了。",
      focus: [
        {
          title: "深蓝釉",
          text: "高温蓝釉以钴为呈色剂，釉层厚，颜色深沉。烧成温度与气氛稍有偏差，颜色就会发黑、发灰或流釉。"
        },
        {
          title: "描金",
          text: "金彩施在烧好的釉面上，再入低温炉烘烧，使金层附着。它不承受高温，因此保存不易，常见脱落与磨损。"
        },
        {
          title: "流与浅腹",
          text: "一侧的流用于倾倒，浅腹便于捧持。器形源自青铜盥洗器，但元代瓷匜可能已经转作他用——功能在变，器形还在。"
        }
      ],
      boundary: "「迎合长生天」是多重成因之一，不能单因解释；必须同时提到钴料、技术、外来审美与宫廷趣味。参考图不是蓝釉描金匜，描金细节不可见，不要用它证明「元代有描金」。匜的功能有争议，不要写死「用来洗手」或「用来倒酒」。尺寸为公开资料，若馆方公布不同数据，以馆方为准。",
      images: [
        {
          label: "器形示意",
          src: "assets/img/06_diagram_form.png",
          alt: "蓝釉描金匜器形与工艺示意图",
          caption: "蓝釉描金匜器形与工艺示意。原创绘制，CC0。金彩按残存痕迹复原大意，非实测。"
        },
        {
          label: "参考器",
          src: "assets/img/06_reference.jpg",
          alt: "蓝釉鸡心执壶，同类蓝釉器参考",
          caption: "同类蓝釉器参考：蓝釉鸡心执壶。非本件匜；来源页未确认馆藏与年代，此角度描金细节不可见。图片：三十三画生，CC BY-SA 4.0。"
        },
        {
          label: "釉面",
          src: "assets/img/06_detail_glaze.jpg",
          alt: "参考器蓝釉釉面细部",
          caption: "参考器釉面细部。局部裁切。描金细节在此角度不可见。图片：三十三画生，CC BY-SA 4.0。"
        }
      ],
      hotspots: [
        {
          x: 18,
          y: 49,
          title: "流",
          text: "一侧的流用于倾倒，器形源自青铜盥洗器。元代瓷匜的具体用途仍有讨论。"
        },
        {
          x: 40,
          y: 57,
          title: "浅腹",
          text: "浅腹便于捧持，也让内壁的描金纹样更容易被看见。"
        },
        {
          x: 72,
          y: 43,
          title: "金线沿着釉面走",
          text: "金彩施在烧好的釉面上，再入低温炉烘烧。它不覆盖器形，只沿着釉面勾出流云与折枝花。"
        }
      ],
      hint: "拖动匜身旋转 · 在档案里点亮金线",
      interaction: {
        type: "gold",
        label: "点亮金线",
        steps: [
          {
            key: "glaze",
            title: "施釉",
            text: "钴蓝釉施在胎体上。颜色来自钴料，厚薄与均匀程度会直接影响烧成后的深浅。"
          },
          {
            key: "fire",
            title: "高温烧成",
            text: "入窑高温烧成，釉层熔融，形成深蓝。温度与气氛稍有偏差，颜色就会发黑、发灰或流釉。"
          },
          {
            key: "gold",
            title: "描金",
            text: "在已经烧成的釉面上，用金彩描绘流云与折枝花。金线不覆盖器形，只沿着釉面走。"
          },
          {
            key: "bake",
            title: "低温烘烧",
            text: "再入低温炉烘烧，让金层附着。金不承受高温，怕磨、怕擦，能留到今天并不容易。"
          }
        ],
        note: "在原创示意图上依次高亮四步，不对参考照片做「修复」或「补金」。金彩按残存痕迹复原大意，非实测。"
      },
      audio: {
        src: "assets/audio/03_grassland_wind.m4a",
        label: "草场风声（合成）",
        note: "与第三展厅共用一条低音量风声。默认关闭，点击后播放。"
      },
      credits: "参考图：三十三画生，CC BY-SA 4.0。器形与工艺示意图：本次制作，CC0。"
    }
  ],

  credits: {
    title: "素材授权与致谢",
    intro: "本展为课堂汇报制作，非正式出版。以下逐条列出藏品、图片、视频与音频来源；完整字段见文件夹内「版权与来源.csv」。",
    collections: [
      "克利夫兰艺术博物馆（Cleveland Museum of Art）：1964.169、1948.215，CC0。",
      "上海博物馆、日本松冈美术馆：公有领域。",
      "首都博物馆、无锡博物院、高安市博物馆、故宫博物院、内蒙古博物院、新疆伊犁哈萨克自治州博物馆：藏品信息参考。",
      "Wikimedia Commons 摄影师：Augusthaiho、HaziiDozen、白色瑰宝、猫猫的日记本、BabelStone、Wmpearl、Daderot、三十三画生。"
    ],
    licenses: [
      ["CC0 1.0", "https://creativecommons.org/publicdomain/zero/1.0/"],
      ["CC BY-SA 3.0", "https://creativecommons.org/licenses/by-sa/3.0/"],
      ["CC BY-SA 4.0", "https://creativecommons.org/licenses/by-sa/4.0/"],
      ["Public Domain Mark", "https://creativecommons.org/publicdomain/mark/1.0/"]
    ],
    originals: [
      "三条环境音、三张示意图：本次制作，CC0。",
      "视频「高足杯」与「大盘」：本次制作，CC0。",
      "视频「凤首扁壶」：本次制作，衍生自 Augusthaiho 的 CC BY-SA 4.0 图片，以 CC BY-SA 4.0 共享。",
      "环境音为合成音效，不是文物原声，也不是现场录音。",
      "3D 模型为按器形比例搭建的简化示意，不是文物扫描或复原。",
      "字体使用系统字体（楷体 / 苹方 / 微软雅黑等），不内嵌商业字体。"
    ]
  }
};
