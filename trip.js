// 第三幕「下山历练」：12 个奇闻异事随机抽 5 个，最后一站固定是心魔劫。
// 三项状态：修为 x、灵石 l、道心 h。道心归零 = 走火入魔，提前结束。
// 选项类型：
//   普通：ok 结果
//   掷签：roll {stat, base}，按灵根加减成功率，ok / bad 两种结果
//   流派专属：need {paths:[…]}；底色专属：need {style}（用从人间带来的东西）
// 结果字段：text 文案，d 状态变化 {x,l,h}，item 奇物，tag 江湖外号前缀，w 外号权重
// 全部结果由 seed + 选择 + 身份确定，刷新、分享后重算都一样。

import { PATH_MAP, STYLES } from './catalog.js';
import { STYLE_EVENTS } from './style-events.js';
export { STYLE_EVENTS };

export const START = { x: 0, l: 3, h: 5 };
export const H_MAX = 10;
export const STOPS = 6;
export const STAT_NAMES = { x: '修为', l: '灵石', h: '道心' };

const P = (...paths) => ({ paths });
const S = style => ({ style });

export const EVENTS = [
  { id: 'e01', title: '龙王借钱', icon: '龙',
    scene: '过河时，水里浮出一条胡子花白的老龙。它说自己是这条河的龙王，最近手头紧，想借三百灵石，保证十倍奉还。',
    options: [
      { text: '借。灵石不够，就把身上的全给它', ok: { text: '龙王收下灵石，留了一片鳞做欠条。到今天也没还。', d: { l: -3, h: 1 }, item: '龙王的欠条', tag: '借钱给龙王的', w: 3 } },
      { text: '「巧了，我也手头紧。要不你借我？」', roll: { stat: 'brain', base: 40 },
        ok: { text: '龙王愣了半天，真借了你五百。它走的时候还在嘀咕：现在的年轻人。', d: { l: 5 }, tag: '反向借到龙王钱的', w: 4 },
        bad: { text: '龙王恼羞成怒，喷了你一身河水。你在岸边晒了一下午。', d: { h: -2 } } },
      { text: '「借钱？先打一架。」', need: P('sword', 'body', 'demonic', 'beast'), ok: { text: '三个回合，龙王认输，还赔了你医药费。', d: { x: 4, l: 2 }, tag: '打过龙王的', w: 4 } },
      { text: '推了推眼镜：「十倍奉还？年化多少？合同呢？」', need: S('zhen'), ok: { text: '龙王算了半天，发现自己是个骗子，哭着走了，落下一袋灵石。', d: { l: 3, x: 1 }, tag: '把龙王问哭的', w: 5 } }
    ] },
  { id: 'e02', title: '会骂人的锅', icon: '锅',
    scene: '路边摊上有一口铁锅正在骂人，骂得很难听。摊主说这锅修炼成精了，便宜卖，就是嘴碎。',
    options: [
      { text: '买下来，背着走', ok: { text: '从此你的饭都很香，耳朵不太清净。', d: { l: -2, h: 1 }, item: '会骂人的锅', tag: '背着一口锅的', w: 3 } },
      { text: '跟锅对骂', roll: { stat: 'free', base: 45 },
        ok: { text: '你骂赢了。锅沉默了很久，摊主送了你一碗面。', d: { x: 2, h: 2 }, tag: '骂赢了一口锅的', w: 4 },
        bad: { text: '锅骂人比你狠多了。你走出三里地还能听见。', d: { h: -2 } } },
      { text: '借这口锅炼一炉丹', need: P('alchemy', 'flora', 'artifact', 'oracle'), game: { type: 'fire', label: '按住添火，火候到了就松手', stat: 'craft' }, ok: { text: '锅一边骂一边把丹炼成了。它说这是它锅生最有意义的一天。', d: { x: 3, l: 3 }, tag: '用骂人锅炼丹的', w: 4 }, bad: { text: '火大了。丹炸了，锅骂得更凶了。', d: { h: -1, x: 1 } } },
      { text: '戴上耳机，蹲在旁边把面吃完', need: S('xiao'), ok: { text: '锅骂了一个时辰，发现你根本没在听，它破防了。', d: { h: 3 }, tag: '对锅免疫的', w: 3 } }
    ] },
  { id: 'e03', title: '魔宗招聘会', icon: '聘',
    scene: '镇上在开宗门招聘会。一家魔道宗门的摊位开出三倍灵石，招聘要求写着：能接受福报。',
    options: [
      { text: '投一份简历试试', ok: { text: '面试官问你能不能每天修炼十二个时辰。你说一天只有十二个时辰。他说对。', d: { l: 4, h: -2 }, tag: '去魔宗面过试的', w: 2 } },
      { text: '当场掀了他们的摊子', roll: { stat: 'force', base: 45 },
        ok: { text: '围观的人鼓起了掌。招聘会结束时，魔宗的摊位前一个人都没有。', d: { x: 2, h: 2 }, tag: '掀了魔宗摊子的', w: 4 },
        bad: { text: '你掀翻了隔壁正经宗门的摊子。赔了钱，还被记了名字。', d: { l: -2, h: -1 } } },
      { text: '帮他们修好掉线的传音阵，收一笔外包费', need: P('artifact', 'array', 'puppet', 'talisman'), game: { type: 'trace', label: '把断掉的阵纹补上', stat: 'craft' }, ok: { text: '魔宗当场要和你签长期合同。你说只接外包。', d: { l: 4, x: 1 }, tag: '魔宗外包供应商', w: 3 }, bad: { text: '修好以后，传音阵只能传出猫叫。魔宗没付钱。', d: { h: -1 }, tag: '让魔宗传音阵学猫叫的', w: 4 } },
      { text: '亮出工牌：「我上家是这个强度。」', need: S('zheng'), ok: { text: '面试官看完你的工牌，当场辞职，跟你走了。', d: { x: 3 }, tag: '把魔宗面试官卷跑的', w: 5 } }
    ] },
  { id: 'e04', title: '狐仙认错人', icon: '狐',
    scene: '一只狐仙拦住你，说你长得像她三百年前的心上人，非要请你吃饭。',
    options: [
      { text: '去吃', ok: { text: '吃到一半她发现认错了。她说饭钱照付，因为你人还不错。', d: { h: 2, l: 1 }, tag: '蹭过狐仙饭的', w: 2 } },
      { text: '礼貌拒绝', ok: { text: '她有点失落，但还是送了你一程。', d: { h: 1 } } },
      { text: '陪她聊聊三百年前那个人', need: P('music', 'soul', 'illusion', 'vow'), ok: { text: '她讲到天亮。临走时说，好久没人愿意听这些了。', d: { x: 3, h: 2 }, item: '狐仙的一缕毛', tag: '给狐仙当过树洞的', w: 4 } },
      { text: '从帆布包里掏出纸巾和暖宝宝', need: S('hu'), ok: { text: '狐仙哭笑不得。后来她逢人就说，你是她三百年来最靠谱的朋友。', d: { h: 3 }, item: '狐仙的一缕毛', tag: '狐仙闺蜜', w: 4 } }
    ] },
  { id: 'e05', title: '秘境排队', icon: '秘',
    scene: '上古秘境开了，门口排了三里地。有人在队伍边上小声问：要号吗？',
    options: [
      { text: '老老实实排队', ok: { text: '排了三天。进去时宝贝已经被拿光，只剩一本《排队心法》。', d: { x: 2, h: -1 }, item: '排队心法', tag: '排过三天队的', w: 2 } },
      { text: '花三块灵石买个号', roll: { stat: 'brain', base: 50 },
        ok: { text: '号是真的。你直接进了内层，捡了一堆宝贝。', d: { l: -3, x: 6 }, tag: '秘境 VIP', w: 3 },
        bad: { text: '号是假的。黄牛已经跑了。', d: { l: -3, h: -2 }, tag: '被黄牛骗过的', w: 3 } },
      { text: '绕到后墙，打个洞进去', need: P('sword', 'body', 'demonic', 'artifact'), ok: { text: '你进去了。后来秘境管理处在那个洞旁边立了块牌子：此处禁止打洞。', d: { x: 4 }, tag: '给秘境开了后门的', w: 4 } },
      { text: '把口罩拉上来，冒充秘境工作人员', need: S('qi'), ok: { text: '你在里面上了一周班，领了工资才出来。没人发现。', d: { x: 4, l: 2 }, tag: '秘境编外员工', w: 5 } }
    ] },
  { id: 'e06', title: '天上掉灵石', icon: '石',
    scene: '一块磨盘大的灵石从天上砸下来，砸出一个坑。坑边已经围了五个修士，互相瞪着。',
    options: [
      { text: '提议六个人平分', ok: { text: '大家看了看彼此，同意了。你分到一小块，还交了五个朋友。', d: { l: 2, h: 1 } } },
      { text: '趁乱抱起来就跑', game: { type: 'timing', label: '看准空当，抢！', stat: 'force' },
        ok: { text: '你抱着灵石跑了三座山，没人追得上。', d: { l: 6 }, tag: '抱着灵石跑了三座山的', w: 4 },
        bad: { text: '五个人一起追了你三座山。灵石最后被第六个人捡走了。', d: { h: -3 } } },
      { text: '掐指一算：一会儿还要掉第二块', need: P('oracle', 'star', 'array', 'talisman'), ok: { text: '你走到三十丈外站好。第二块正好落在你脚边。', d: { l: 5, x: 2 }, tag: '算准天上掉馅饼的', w: 5 } },
      { text: '掏出龙王的欠条：「这块就当利息了。」', need: { item: '龙王的欠条', hidden: true }, ok: { text: '五个修士面面相觑，谁也不敢跟龙王的债主抢。', d: { l: 5 }, tag: '找龙王收了利息的', w: 5 } },
      { text: '戴着墨镜站在旁边，等他们打完', need: S('cang'), ok: { text: '他们打了一下午。你把灵石搬走的时候，没人注意到你。', d: { l: 6 }, tag: '笑到最后的', w: 4 } }
    ] },
  { id: 'e07', title: '鬼市', icon: '鬼',
    scene: '半夜误入鬼市。摊主全是鬼，这里不收灵石，只收「没说出口的话」。',
    options: [
      { text: '说一句没说出口的话，换一盏灯', ok: { text: '你说了一句一直没跟家里人说的话。摊主收下，把灯递给你，什么也没问。', d: { h: 2 }, item: '鬼市的灯', tag: '在鬼市买过灯的', w: 2 } },
      { text: '跟鬼摊主砍价', roll: { stat: 'brain', base: 45 },
        ok: { text: '你把一句「其实我挺想你的」砍成了半句「其实」。摊主说你是三百年来最会砍价的人。', d: { l: 3 }, tag: '在鬼市砍过价的', w: 4 },
        bad: { text: '鬼摊主跟了你三条街，一直在念叨。', d: { h: -2 } } },
      { text: '帮一个鬼，把话带给他还在世的女儿', need: P('soul', 'vow', 'music', 'alchemy'), ok: { text: '你把话带到了。她哭了很久，然后请你吃了顿饭。', d: { x: 4, h: 2 }, tag: '鬼市信使', w: 5 } },
      { text: '拉下眼罩，在鬼市睡了一觉', need: S('sui'), ok: { text: '鬼们觉得你胆子太大，没人敢动你。醒来时枕边多了几块灵石。', d: { h: 3, l: 2 }, tag: '在鬼市睡过觉的', w: 5 } }
    ] },
  { id: 'e08', title: '宗门团建', icon: '建',
    scene: '宗门组织团建：先爬九千级台阶，然后全体一起唱宗歌。长老说，不来的扣贡献点。',
    options: [
      { text: '老实参加', ok: { text: '爬完台阶，你连宗歌的调都找不着了。', d: { x: 2, h: -1 } } },
      { text: '请病假', roll: { stat: 'brain', base: 55 },
        ok: { text: '假批了。你在宿舍睡了一整天。', d: { h: 2 }, tag: '团建请假成功的', w: 3 },
        bad: { text: '长老亲自来探病。你只好在床上装了三天。', d: { h: -2 } } },
      { text: '做个傀儡替你去', need: P('puppet', 'artifact', 'talisman', 'illusion'), ok: { text: '傀儡爬得比谁都快，宗歌唱得比谁都响。长老点名表扬了它。', d: { h: 2, x: 1 }, tag: '让傀儡替我团建的', w: 5 } },
      { text: '喝一口冰美式，一口气冲上山顶', need: S('yuan'), ok: { text: '你到山顶时长老还在半山腰。他说你这种人宗门里不常见。', d: { x: 4 }, tag: '团建第一名', w: 3 } }
    ] },
  { id: 'e09', title: '紧张的劫匪', icon: '匪',
    scene: '山道上跳出一个劫匪，大喊：「此山是我开！」他握刀的手在抖，看起来比你还紧张。',
    options: [
      { text: '给他两块灵石', ok: { text: '他接过灵石，鞠了一躬，说这是他第一次成功。', d: { l: -2, h: 1 } } },
      { text: '跟他打', roll: { stat: 'force', base: 60 },
        ok: { text: '他三招就倒了，躺在地上说：其实我是兼职的。', d: { x: 3, l: 2 } },
        bad: { text: '你一脚踩空摔了。他趁机拿走了你的灵石，还回头说了句对不起。', d: { h: -2, l: -2 }, tag: '被兼职劫匪抢过的', w: 3 } },
      { text: '问他为什么出来当劫匪', need: P('soul', 'vow', 'flora', 'beast'), ok: { text: '他说家里老娘病了。你帮他在镇上找了份活。', d: { h: 2, x: 2 }, item: '劫匪的感谢信', tag: '劝退过劫匪的', w: 4 } },
      { text: '把锅放下：「你跟他说。」', need: { item: '会骂人的锅', hidden: true }, ok: { text: '锅骂了一刻钟。劫匪哭着把刀交了出来，还给了你两块灵石当精神损失费。', d: { l: 2, h: 1 }, tag: '用锅骂哭劫匪的', w: 5 } },
      { text: '给他做一份五年职业规划', need: S('zheng'), ok: { text: '他听完决定转行。三年后，他成了镇上最大镖局的老板。', d: { x: 2, l: 1 }, tag: '劫匪的职业导师', w: 5 } }
    ] },
  { id: 'e10', title: '灵兽蹲包子铺', icon: '兽',
    scene: '镇上一头灵兽暴走，掀翻了三个摊子，现在正蹲在包子铺门口，谁也不让过。',
    options: [
      { text: '先把人群疏散开', ok: { text: '没人受伤。灵兽在门口蹲了一天，自己走了。', d: { h: 1, x: 1 } } },
      { text: '上去正面制服它', game: { type: 'fire', label: '按住蓄力，松手出招', stat: 'force' },
        ok: { text: '你把它按住了。镇上的人请你吃了一笼包子。', d: { x: 4 }, tag: '徒手按住灵兽的', w: 4 },
        bad: { text: '它把你拱进了包子铺的蒸笼里。', d: { h: -3 }, tag: '被灵兽拱进蒸笼的', w: 4 } },
      { text: '买一笼包子，蹲下来陪它吃', need: P('beast', 'flora', 'alchemy', 'music'), ok: { text: '它原来只是饿了。吃完以后，它决定跟着你。', d: { h: 3 }, item: '一只赖上你的灵兽', tag: '被灵兽赖上的', w: 5 } },
      { text: '戴上耳机，放首歌给它听', need: S('xiao'), ok: { text: '它听着听着睡着了。包子铺老板说你是专业的。', d: { h: 2, x: 1 }, tag: '给灵兽放歌的', w: 3 } }
    ] },
  { id: 'e11', title: '前辈渡劫', icon: '雷',
    scene: '你路过一位前辈的渡劫现场。雷劈得很准，前辈好像快撑不住了。',
    options: [
      { text: '远远看着，记笔记', ok: { text: '你学到了很多。主要是学到了以后不要这么渡劫。', d: { x: 1 } } },
      { text: '冲上去，帮他扛一道雷', game: { type: 'timing', label: '雷落下那一刻，闪！', stat: 'grit' },
        ok: { text: '你扛住了。前辈渡劫成功，收你做了记名弟子。', d: { x: 5, h: 1 }, tag: '替人挨过雷的', w: 5 },
        bad: { text: '你被劈得外焦里嫩，头发卷了三天。', d: { h: -3, x: 1 }, tag: '被雷劈卷了头发的', w: 4 } },
      { text: '现场布一个避雷阵', need: P('array', 'artifact', 'talisman', 'star'), game: { type: 'trace', label: '照着阵纹画一笔', stat: 'craft' }, ok: { text: '雷全被引走了。前辈渡劫成功，塞给你一大袋灵石。', d: { x: 3, l: 3 }, tag: '天劫克星', w: 5 }, bad: { text: '阵纹画歪了，雷劈在你脚边，鞋没了。', d: { h: -2, x: 1 }, tag: '被雷劈丢了鞋的', w: 3 } },
      { text: '等雷劫结束，去捡雷击木', need: S('cang'), ok: { text: '前辈还在调息，你已经把雷击木卖了个好价钱。', d: { l: 4 }, tag: '雷劫捡漏专业户', w: 4 } }
    ] },
  { id: 'e12', title: '说书人', icon: '书',
    scene: '茶馆里的说书人正在讲一个故事，主角听着很像你，而且讲得非常离谱。',
    options: [
      { text: '上去纠正他', ok: { text: '他改了。改得更离谱了。', d: { h: -1, x: 1 } } },
      { text: '打赏两块灵石，让他讲得更夸张一点', ok: { text: '第二天，你的故事传遍了三个镇，每个版本都不一样。', d: { l: -2, h: 2 }, tag: '传说中的', w: 3 } },
      { text: '上台接着讲，讲得比他还好', need: P('illusion', 'music', 'talisman', 'oracle'), ok: { text: '茶馆老板当场要签你。说书人成了你的忠实听众。', d: { l: 3, x: 2 }, tag: '茶馆头牌', w: 4 } },
      { text: '让赖上你的灵兽上台表演', need: { item: '一只赖上你的灵兽', hidden: true }, ok: { text: '灵兽翻了三个跟头，全场叫好。打赏比说书人一个月挣的还多。', d: { l: 4, h: 1 }, tag: '带灵兽卖艺的', w: 5 } },
      { text: '坐下听完，回去写了一本《真实的我》', need: S('yuan'), ok: { text: '写了三百页。卖得没有说书人的版本好。', d: { x: 2, h: 1 }, tag: '自己写传记的', w: 4 } }
    ] }
];

// 心魔：最后一站。scene 里的 {relic} 会换成玩家从人间带来的东西
const STYLE_XINMO = {
  zheng: { text: '给心魔布置了明天的 KPI', ok: { text: '心魔看了一眼 KPI，先崩溃了。卷王连心魔都能卷走。', d: { x: 4 }, end: 'own' } },
  xiao: { text: '拉着心魔一起摸鱼', ok: { text: '你们在洞府里躺了一整天。心魔说，原来不上班是这种感觉。然后它就散了。', d: { h: 4 }, end: 'own' } },
  hu: { text: '问心魔：「吃饭了没？」', ok: { text: '心魔愣住了。它说好久没人问过它这个问题。', d: { h: 3, x: 2 }, end: 'own' } },
  zhen: { text: '「明天要打卡？依据是什么？」', ok: { text: '心魔说不出依据。它连自己存在的依据都说不出来。', d: { x: 3 }, end: 'own' } },
  qi: { text: '给心魔也报名一次外门考核', ok: { text: '心魔考上了，现在是你师弟。', d: { x: 3, l: 2 }, end: 'own' } },
  yuan: { text: '一口喝完冰美式：「我就是要修下去。」', ok: { text: '冰化了，心魔也化了。', d: { x: 5 }, end: 'own' } },
  sui: { text: '拉下眼罩：「明天的事明天再说。」', ok: { text: '你睡着了。醒来时心魔已经走了，说跟你耗不起。', d: { h: 4 }, end: 'own' } },
  cang: { text: '摘下墨镜，看了它一眼', ok: { text: '没人知道那一眼里有什么。心魔当场消失了。', d: { x: 4 }, end: 'own' } }
};
const ITEM_XINMO = {
  '会骂人的锅': { text: '把锅放下：「你来。」', ok: { text: '锅骂了心魔一整夜。天亮时心魔说：算了，我还是回去上班吧。', d: { x: 3, h: 2 }, end: 'item' } },
  '鬼市的灯': { text: '提起鬼市的灯，照了照它', ok: { text: '灯光里，心魔变回了下班路上的你，冲你挥了挥手。', d: { x: 3, h: 3 }, end: 'talk' } },
  '一只赖上你的灵兽': { text: '灵兽扑了上去', ok: { text: '灵兽把心魔舔散了，看起来很得意。', d: { x: 3, h: 2 }, end: 'item' } },
  '龙王的欠条': { text: '把龙王的欠条塞给它：「这笔债归你了。」', ok: { text: '心魔拿着欠条去找龙王要账，再也没回来。', d: { x: 3, l: 2 }, end: 'item' } },
  '狐仙的一缕毛': { text: '对着狐毛吹一口气', ok: { text: '狐仙应声而来，把心魔说哭了。', d: { x: 3, h: 2 }, end: 'item' } },
  '劫匪的感谢信': { text: '把劫匪的感谢信念给它听', ok: { text: '心魔沉默了很久，说：原来你在这边，也帮到了人。', d: { x: 4, h: 2 }, end: 'talk' } },
  '排队心法': { text: '运转《排队心法》，跟它耗着', ok: { text: '心魔排了三天队，排到窗口时，窗口关了。', d: { x: 3 }, end: 'item' } }
};
export const ITEMS = Object.keys(ITEM_XINMO);

export const XINMO = {
  id: 'x00', title: '心魔劫', icon: '魔', final: true,
  scene: '历练的最后一夜，你在洞府里打坐。对面坐着另一个你：穿着工位上那身衣服，带着{relic}，手里攥着手机。它说：「回去吧。明天九点还要打卡。」',
  options: [
    { text: '「这里不用打卡。」挥手斩了它', game: { type: 'timing', label: '看准破绽，出剑！', stat: 'grit' },
      ok: { text: '心魔散了。从那以后，你再也没梦见过工位。', d: { x: 6 }, end: 'cut' },
      bad: { text: '你砍了个空。它还坐在那儿，看着你。', d: { h: -3 }, end: 'stuck' } },
    { text: '坐下来，跟它聊了一整夜', ok: { text: '天亮时，它把手机放下，说了句「你过得挺好」，自己走了。', d: { h: 3, x: 3 }, end: 'talk' } },
    { text: '「……其实，我有点想回去。」', ok: { text: '眼前一黑。你在末班地铁上醒来，手里攥着一张看不懂的符纸。', d: {}, end: 'home' } },
    ...STYLES.map(s => ({ ...STYLE_XINMO[s.id], need: { style: s.id, hidden: true } })),
    ...Object.entries(ITEM_XINMO).map(([item, o]) => ({ ...o, need: { item, hidden: true } }))
  ]
};

export const ENDINGS = {
  cut: { name: '斩心魔', line: '前尘已断，大道在前。' },
  talk: { name: '与心魔和解', line: '你没有赶走过去的自己，带着它一起走了。' },
  own: { name: '本色破心魔', line: '用人间那一套，破了修仙界的劫。' },
  item: { name: '奇物破心魔', line: '一路捡来的东西，在最后派上了用场。' },
  stuck: { name: '心魔未除', line: '它还在。不过你已经不怕它了。' },
  home: { name: '隐藏结局：回到人间', line: '你在末班地铁上醒来，一切好像只是一场梦。直到你摸到口袋里那张符纸。' },
  zouhuo: { name: '走火入魔', line: '道心崩了。阿照把你从路边捡回宗门，说下回别这么拼。' }
};

const LEVELS = [[0, '练气'], [5, '筑基'], [10, '金丹'], [15, '元婴'], [20, '化神']];
export const levelOf = x => LEVELS.filter(([n]) => x >= n).pop()[1];

// ---------- 运行 ----------
function rng(seed) {
  let a = seed >>> 0;
  return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ t >>> 15, t | 1); t ^= t + Math.imul(t ^ t >>> 7, t | 61); return ((t ^ t >>> 14) >>> 0) / 4294967296; };
}
// 每趟：底色专属奇遇抽 2 个 + 公共奇遇抽 3 个，打乱顺序，最后是心魔劫
export function route(seed, style = 'zheng') {
  const r = rng(seed);
  const shuffle = list => { const a = [...list]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const own = shuffle(STYLE_EVENTS[style] || STYLE_EVENTS.zheng).slice(0, 2);
  const common = shuffle(EVENTS).slice(0, STOPS - 3);
  return [...shuffle([...own, ...common]), XINMO];
}
// 集市：第 2 站和第 4 站之后各有一个，每次随机摆 4 样
export const SHOP_AFTER = [2, 4];
export const GOODS = [
  { id: 'pill', name: '止血丹', cost: 2, desc: '道心 +3', d: { h: 3 } },
  { id: 'charm', name: '平安符', cost: 3, desc: '下一次掷签或小游戏更容易', buff: 'lucky' },
  { id: 'incense', name: '回神香', cost: 3, desc: '修为 +3', d: { x: 3 } },
  { id: 'mirror', name: '护心镜', cost: 3, desc: '挡下一次道心损失', buff: 'guard' },
  { id: 'candy', name: '糖葫芦', cost: 1, desc: '道心 +1，好吃', d: { h: 1 } },
  { id: 'ticket', name: '仙界彩票', cost: 2, desc: '三成概率中 8 块灵石', lottery: true }
];
export function shopGoods(seed, idx) {
  const r = rng((seed ^ Math.imul(idx + 7, 40503)) >>> 0), list = GOODS.map((_, i) => i);
  for (let i = list.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [list[i], list[j]] = [list[j], list[i]]; }
  return list.slice(0, 4).sort((a, b) => a - b);
}

export function canUse(opt, id, items = []) {
  if (!opt.need) return true;
  if (opt.need.paths) return opt.need.paths.includes(id.path);
  if (opt.need.style) return opt.need.style === id.style;
  if (opt.need.item) return items.includes(opt.need.item);
  return false;
}
export function needLabel(opt) {
  if (!opt.need) return '';
  if (opt.need.paths) return opt.need.paths.map(p => PATH_MAP[p].name).join(' / ');
  if (opt.need.item) return `奇物 · ${opt.need.item}`;
  const s = STYLES.find(x => x.id === opt.need.style);
  return `${s.name}型 · 用${s.relic}`;
}
export function chanceOf(opt, traits, lucky = false) {
  if (!opt.roll) return 100;
  const c = opt.roll.base + ((traits?.[opt.roll.stat] ?? 65) - 65) * 0.6 + (lucky ? 15 : 0);
  return Math.max(15, Math.min(95, Math.round(c / 5) * 5));
}
// 小游戏难度：命中区半宽（百分比）。灵根越高、带了平安符，越容易
export function gameEase(opt, traits, lucky = false) {
  if (!opt.game) return 0;
  return Math.max(6, Math.min(22, Math.round(10 + ((traits?.[opt.game.stat] ?? 65) - 65) * 0.22 + (lucky ? 7 : 0))));
}
export function sceneOf(ev, style) {
  return ev.scene.replace('{relic}', STYLES.find(s => s.id === style)?.relic || '工牌');
}

// 单独结算一个选项（每日奇遇用）。k 只用来区分掷签的随机数
export function resolveOption(opt, id, seed, k, gameRes, lucky = false) {
  let ok = true, chance = 100;
  if (opt.roll) { chance = chanceOf(opt, id.traits, lucky); ok = rng((seed ^ Math.imul(k + 1, 2654435761)) >>> 0)() * 100 < chance; }
  else if (opt.game) ok = gameRes === 1;
  return { ok, chance, out: ok ? opt.ok : opt.bad };
}
export function daySeed(dateStr) {
  let h = 2166136261;
  for (const ch of dateStr) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); }
  return h >>> 0;
}
export const dailyEvent = dateStr => EVENTS[daySeed(dateStr) % EVENTS.length];

// id: { path, style, traits, title }
// trip: { seed, picks:[选项序号], res:[小游戏结果 1/0，非小游戏为 -1], buys:[[集市 1 买的货], [集市 2 买的货]] }
export function runTrip(id, trip) {
  const stops = route(trip.seed, id.style);
  const picks = trip.picks || [], res = trip.res || [], buys = trip.buys || [];
  const st = { ...START }, items = [], log = [], bought = [];
  const buff = { lucky: false, guard: false };
  let ending = null, best = null, shopNext = null;
  const apply = (d = {}) => {
    let h = d.h || 0;
    if (h < 0 && buff.guard) { h = 0; buff.guard = false; }
    st.x = Math.max(0, st.x + (d.x || 0));
    st.l = Math.max(0, st.l + (d.l || 0));
    st.h = Math.min(H_MAX, st.h + h);
    return h !== (d.h || 0);
  };
  for (let k = 0; k < STOPS; k++) {
    const si = SHOP_AFTER.indexOf(k);
    if (si >= 0) {
      if (buys.length <= si) { if (picks.length > k) return { error: true }; shopNext = { idx: si, goods: shopGoods(trip.seed, si) }; break; }
      const offer = shopGoods(trip.seed, si), list = buys[si];
      if (!Array.isArray(list) || new Set(list).size !== list.length) return { error: true };
      for (const gi of list) {
        const g = GOODS[gi];
        if (!g || !offer.includes(gi) || st.l < g.cost) return { error: true };
        st.l -= g.cost;
        let won = null;
        if (g.d) apply(g.d);
        if (g.buff) buff[g.buff] = true;
        if (g.lottery) { won = rng((trip.seed ^ Math.imul(si + 3, 9973)) >>> 0)() < 0.3; if (won) st.l += 8; }
        bought.push({ shop: si, good: g, won });
      }
    }
    if (k >= picks.length) break;
    const ev = stops[k], opt = ev.options[picks[k]];
    if (!opt || !canUse(opt, id, items)) return { error: true };
    let ok = true, chance = 100, ease = 0;
    if (opt.roll) {
      chance = chanceOf(opt, id.traits, buff.lucky); buff.lucky = false;
      ok = rng((trip.seed ^ Math.imul(k + 1, 2654435761)) >>> 0)() * 100 < chance;
    } else if (opt.game) {
      if (res[k] !== 0 && res[k] !== 1) return { error: true, pendingGame: k };
      ease = gameEase(opt, id.traits, buff.lucky); buff.lucky = false;
      ok = res[k] === 1;
    }
    const out = ok ? opt.ok : opt.bad;
    const guarded = apply(out.d);
    if (out.item && !items.includes(out.item)) items.push(out.item);
    if (out.tag && (!best || (out.w || 1) >= best.w)) best = { tag: out.tag, w: out.w || 1 };
    log.push({ k, ev, pick: picks[k], opt, res: out, ok, chance, ease, roll: Boolean(opt.roll), game: opt.game?.type || null, guarded });
    if (st.h <= 0) { st.h = 0; ending = 'zouhuo'; break; }
    if (ev.final) ending = out.end;
  }
  const done = Boolean(ending);
  const nick = (best ? best.tag : ending === 'zouhuo' ? '走火入魔的' : '下山没惹事的') + id.title;
  return { stops, st, items, log, bought, buff, ending, done, shop: done ? null : shopNext, next: done || shopNext ? null : stops[log.length], at: log.length, nick, level: levelOf(st.x) };
}
