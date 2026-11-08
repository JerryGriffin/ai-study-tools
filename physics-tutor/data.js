/* 物理答疑室 · 本地课程数据
 * 大学普通物理学章节、公式卡片与练习题库。所有公式均为 LaTeX 源串。
 */
(function () {
  'use strict';
  const T = String.raw;

  const CHAPTERS = [
    {
      id: 'kinematics',
      index: 1,
      name: '质点运动学',
      glyph: 'v',
      short: '运动学',
      intro: '用位置、速度和加速度描述运动。先选参考系，再写分量，最后积分或求导。',
      keywords: ['位置矢量', '位移', '速度', '加速度', '抛体运动', '圆周运动', '相对运动'],
      formulas: [
        { name: '位置、速度与加速度', tex: T`\vec v=\frac{d\vec r}{dt},\qquad \vec a=\frac{d\vec v}{dt}=\frac{d^2\vec r}{dt^2}` },
        { name: '匀加速直线运动', tex: T`v=v_0+at,\qquad x=x_0+v_0t+\frac12at^2,\qquad v^2-v_0^2=2a\Delta x` },
        { name: '抛体运动', tex: T`x=v_0\cos\theta\,t,\qquad y=v_0\sin\theta\,t-\frac12gt^2` },
        { name: '圆周运动', tex: T`a_n=\frac{v^2}{R}=\omega^2R,\qquad a_t=\frac{dv}{dt}` }
      ],
      prompts: ['抛体运动的轨迹怎么推？', '切向加速度和法向加速度怎么分？', '相对运动题该怎么选参考系？']
    },
    {
      id: 'newton',
      index: 2,
      name: '牛顿运动定律',
      glyph: 'F',
      short: '牛顿定律',
      intro: '受力分析是核心：选研究对象、画力、建坐标、列方程。不要漏约束力。',
      keywords: ['惯性系', '受力分析', '摩擦力', '圆周运动', '连接体', '非惯性系'],
      formulas: [
        { name: '牛顿第二定律', tex: T`\sum\vec F=m\vec a=\frac{d\vec p}{dt}` },
        { name: '滑动摩擦', tex: T`f_k=\mu_kN` },
        { name: '圆周运动动力学', tex: T`\sum F_n=\frac{mv^2}{R},\qquad \sum F_t=ma_t` },
        { name: '非惯性系惯性力', tex: T`\vec F_{\text{惯}}=-m\vec a_0` }
      ],
      prompts: ['连接体问题怎么列方程？', '摩擦力方向怎么判断？', '非惯性系里为什么要加惯性力？']
    },
    {
      id: 'momentum-energy',
      index: 3,
      name: '动量与能量',
      glyph: 'p',
      short: '动量能量',
      intro: '守恒定律比逐点受力更普适。先判断守恒条件，再写初末状态。',
      keywords: ['动量定理', '动量守恒', '功', '动能定理', '势能', '机械能守恒', '碰撞'],
      formulas: [
        { name: '动量定理', tex: T`\vec I=\int\vec F\,dt=\Delta\vec p` },
        { name: '动量守恒', tex: T`\sum\vec p_i=\sum\vec p_f\quad(\sum\vec F_{\text{外}}=0)` },
        { name: '动能定理', tex: T`W_{\text{合}}=\Delta E_k=\frac12mv^2-\frac12mv_0^2` },
        { name: '机械能守恒', tex: T`E_k+E_p=\text{常量}\quad(\text{只有保守力做功})` }
      ],
      prompts: ['完全弹性碰撞和完全非弹性碰撞怎么区分？', '动量守恒但机械能不守恒的例子？', '变力做功怎么算？']
    },
    {
      id: 'rotation',
      index: 4,
      name: '刚体转动',
      glyph: 'ω',
      short: '刚体',
      intro: '把质点力学推广到有空间分布的物体：转动惯量相当于质量，力矩相当于力。',
      keywords: ['转动惯量', '力矩', '角动量', '平行轴定理', '刚体定轴转动'],
      formulas: [
        { name: '转动定律', tex: T`M=I\alpha,\qquad L=I\omega` },
        { name: '转动惯量', tex: T`I=\sum m_ir_i^2=\int r^2\,dm` },
        { name: '平行轴定理', tex: T`I=I_C+md^2` },
        { name: '角动量定理', tex: T`\int M\,dt=\Delta L` }
      ],
      prompts: ['圆盘和圆环的转动惯量怎么推？', '角动量守恒什么时候成立？', '刚体滚动时摩擦力做功吗？']
    },
    {
      id: 'oscillation',
      index: 5,
      name: '振动与波动',
      glyph: '≈',
      short: '振动波动',
      intro: '线性回复力给出简谐解；波是振动状态在介质中的传播。',
      keywords: ['简谐振动', '单摆', '阻尼振动', '波速', '波长', '驻波', '多普勒效应'],
      formulas: [
        { name: '简谐振动', tex: T`x=A\cos(\omega t+\varphi),\qquad \omega=\sqrt{\frac{k}{m}}` },
        { name: '单摆', tex: T`T=2\pi\sqrt{\frac{l}{g}}` },
        { name: '波动方程', tex: T`y=A\cos\left[\omega\left(t-\frac{x}{v}\right)+\varphi\right]` },
        { name: '波速关系', tex: T`v=\lambda f=\frac{\lambda}{T}` }
      ],
      prompts: ['简谐振动的能量怎么变化？', '波速和质点振动速度有什么区别？', '驻波是怎么形成的？']
    },
    {
      id: 'thermo',
      index: 6,
      name: '热学与热力学',
      glyph: 'T',
      short: '热学',
      intro: '宏观热现象来自分子运动的统计平均；热力学第一定律管能量，第二定律管方向。',
      keywords: ['理想气体', '气体动理论', '热力学第一定律', '等值过程', '循环', '熵', '第二定律'],
      formulas: [
        { name: '理想气体状态方程', tex: T`pV=nRT,\qquad p=nkT` },
        { name: '热力学第一定律', tex: T`\Delta U=Q+W` },
        { name: '定容与定压摩尔热容', tex: T`C_V=\frac{i}{2}R,\qquad C_p=C_V+R` },
        { name: '卡诺效率', tex: T`\eta=1-\frac{T_2}{T_1}` }
      ],
      prompts: ['等温、等压、绝热过程怎么判断做功？', '熵增加原理怎么理解？', '理想气体内能为什么只和温度有关？']
    },
    {
      id: 'electrostatics',
      index: 7,
      name: '静电场',
      glyph: 'E',
      short: '静电场',
      intro: '先看对称性：对称时用高斯定理求场强，再积分求电势。',
      keywords: ['库仑定律', '电场强度', '高斯定理', '电势', '电势能', '导体', '电介质'],
      formulas: [
        { name: '库仑定律', tex: T`\vec F=\frac{1}{4\pi\varepsilon_0}\frac{q_1q_2}{r^2}\hat r` },
        { name: '电场强度', tex: T`\vec E=\frac{\vec F}{q_0},\qquad V=\frac{W}{q_0}` },
        { name: '高斯定理', tex: T`\oint_S\vec E\cdot d\vec A=\frac{q_{\text{内}}}{\varepsilon_0}` },
        { name: '电势与场强', tex: T`V=\int_P^\infty\vec E\cdot d\vec l,\qquad \vec E=-\nabla V` }
      ],
      prompts: ['高斯面怎么选？', '电势和电场强度有什么关系？', '导体静电平衡有哪些性质？']
    },
    {
      id: 'magnetism',
      index: 8,
      name: '磁场与电磁感应',
      glyph: 'B',
      short: '磁场',
      intro: '磁场由运动电荷产生；变化的磁通量激发电动势。先判断方向，再算大小。',
      keywords: ['毕奥萨伐尔定律', '安培环路定理', '洛伦兹力', '法拉第定律', '楞次定律', '位移电流'],
      formulas: [
        { name: '洛伦兹力', tex: T`\vec F=q\vec v\times\vec B` },
        { name: '安培环路定理', tex: T`\oint_L\vec B\cdot d\vec l=\mu_0 I_{\text{内}}` },
        { name: '法拉第电磁感应定律', tex: T`\mathcal E=-\frac{d\Phi_B}{dt}` },
        { name: '长直导线磁场', tex: T`B=\frac{\mu_0I}{2\pi r}` }
      ],
      prompts: ['安培环路定理什么时候能用？', '楞次定律怎么判断感应电流方向？', '动生电动势和感生电动势有什么区别？']
    },
    {
      id: 'optics',
      index: 9,
      name: '波动光学',
      glyph: 'λ',
      short: '光学',
      intro: '光程差决定干涉强弱；衍射是同一波前上无穷多子波的叠加。',
      keywords: ['光的干涉', '光程差', '薄膜干涉', '单缝衍射', '光栅', '偏振', '半波损失'],
      formulas: [
        { name: '双缝干涉', tex: T`\Delta x=\frac{D}{d}\lambda` },
        { name: '光程差与明暗纹', tex: T`\delta=k\lambda\ (\text{明}),\qquad \delta=\left(k+\frac12\right)\lambda\ (\text{暗})` },
        { name: '单缝衍射', tex: T`a\sin\theta=k\lambda\ (\text{暗纹})` },
        { name: '光栅方程', tex: T`d\sin\theta=k\lambda` }
      ],
      prompts: ['薄膜干涉什么时候有半波损失？', '单缝衍射和双缝干涉的条纹有什么区别？', '光栅常数怎么影响条纹间距？']
    },
    {
      id: 'modern',
      index: 10,
      name: '近代物理初步',
      glyph: 'h',
      short: '近代物理',
      intro: '微观客体具有波粒二象性；能量量子化和不确定关系是理解原子与光子的入口。',
      keywords: ['光电效应', '光子', '德布罗意波', '玻尔模型', '不确定关系', '量子数'],
      formulas: [
        { name: '光子能量与动量', tex: T`E=h\nu=\frac{hc}{\lambda},\qquad p=\frac{h}{\lambda}` },
        { name: '光电效应', tex: T`h\nu=W+\frac12mv_{\max}^2` },
        { name: '德布罗意波长', tex: T`\lambda=\frac{h}{p}` },
        { name: '不确定关系', tex: T`\Delta x\,\Delta p_x\ge\frac{\hbar}{2}` }
      ],
      prompts: ['光电效应为什么不能用波动说解释？', '德布罗意波长怎么算？', '玻尔模型中能级差和光谱线有什么关系？']
    }
  ];

  const QUESTIONS = [
    {
      id: 'kin-1', chapter: 'kinematics', level: 1, title: '匀加速直线运动',
      question: T`一质点从静止开始以 $2\,\mathrm{m/s^2}$ 匀加速运动，求 $5\,\mathrm{s}$ 后的速度和位移。`,
      hint: T`直接用 $v=v_0+at$ 和 $x=v_0t+\frac12at^2$。`,
      solution: T`**速度：** $v=0+2\times5=10\,\mathrm{m/s}$。

**位移：** $x=0+\frac12\times2\times5^2=25\,\mathrm{m}$。

> 自检：平均速度 $\bar v=5\,\mathrm{m/s}$，乘时间 $5\,\mathrm{s}$ 也得 $25\,\mathrm{m}$。`,
      answer: T`$v=10\,\mathrm{m/s},\ x=25\,\mathrm{m}$`
    },
    {
      id: 'kin-2', chapter: 'kinematics', level: 2, title: '平抛运动',
      question: T`从高 $20\,\mathrm{m}$ 处水平抛出一小球，初速度 $10\,\mathrm{m/s}$，取 $g=10\,\mathrm{m/s^2}$，求落地时间和水平射程。`,
      hint: T`竖直方向自由落体，水平方向匀速。`,
      solution: T`**竖直：** $h=\frac12gt^2\Rightarrow t=\sqrt{2h/g}=2\,\mathrm{s}$。

**水平：** $x=v_0t=10\times2=20\,\mathrm{m}$。

> 落地速度还要把竖直分速度 $v_y=gt=20\,\mathrm{m/s}$ 与水平分速度合成。`,
      answer: T`$t=2\,\mathrm{s},\ x=20\,\mathrm{m}$`
    },
    {
      id: 'newton-1', chapter: 'newton', level: 1, title: '斜面上的受力分析',
      question: T`质量 $2\,\mathrm{kg}$ 的物体放在倾角 $30^\circ$ 的光滑斜面上，求下滑加速度，取 $g=10\,\mathrm{m/s^2}$。`,
      hint: T`沿斜面方向只有重力分量 $mg\sin\theta$。`,
      solution: T`沿斜面：$ma=mg\sin30^\circ$，所以
$$a=g\sin30^\circ=10\times\frac12=5\,\mathrm{m/s^2}.$$

> 光滑斜面上支持力与重力垂直分量平衡，不影响沿斜面加速度。`,
      answer: T`$a=5\,\mathrm{m/s^2}$`
    },
    {
      id: 'newton-2', chapter: 'newton', level: 2, title: '连接体',
      question: T`两个质量分别为 $m_1=1\,\mathrm{kg}$、$m_2=3\,\mathrm{kg}$ 的物体用轻绳连接，在水平光滑桌面上用 $8\,\mathrm{N}$ 的水平力拉 $m_2$，求加速度和绳张力。`,
      hint: T`先整体求加速度，再隔离一个物体求张力。`,
      solution: T`整体：$a=F/(m_1+m_2)=8/4=2\,\mathrm{m/s^2}$。

隔离 $m_1$：$T=m_1a=2\,\mathrm{N}$。

> 隔离 $m_2$ 验证：$F-T=8-2=6=3\times2$。`,
      answer: T`$a=2\,\mathrm{m/s^2},\ T=2\,\mathrm{N}$`
    },
    {
      id: 'me-1', chapter: 'momentum-energy', level: 1, title: '动量守恒',
      question: T`质量 $2\,\mathrm{kg}$ 的小车以 $3\,\mathrm{m/s}$ 与静止的 $1\,\mathrm{kg}$ 小车发生完全非弹性碰撞，求碰后共同速度。`,
      hint: T`完全非弹性碰撞只动量守恒。`,
      solution: T`$$m_1v_1=(m_1+m_2)v,$$
$$v=\frac{2\times3}{3}=2\,\mathrm{m/s}.$$

> 碰后动能 $6\,\mathrm{J}$，碰前 $9\,\mathrm{J}$，损失的 $3\,\mathrm{J}$ 转为内能。`,
      answer: T`$v=2\,\mathrm{m/s}$`
    },
    {
      id: 'me-2', chapter: 'momentum-energy', level: 2, title: '机械能守恒',
      question: T`小球从高 $5\,\mathrm{m}$ 处由静止滑下光滑曲面，求到达地面时的速度，取 $g=10\,\mathrm{m/s^2}$。`,
      hint: T`只有重力做功，机械能守恒。`,
      solution: T`$$mgh=\frac12mv^2\Rightarrow v=\sqrt{2gh}=\sqrt{100}=10\,\mathrm{m/s}.$$`,
      answer: T`$v=10\,\mathrm{m/s}$`
    },
    {
      id: 'rot-1', chapter: 'rotation', level: 2, title: '圆盘转动惯量',
      question: T`质量 $M$、半径 $R$ 的均匀圆盘绕中心轴转动，求转动惯量。`,
      hint: T`用 $I=\int r^2\,dm$，面密度 $\sigma=M/(\pi R^2)$。`,
      solution: T`$$I=\int_0^R r^2\cdot 2\pi r\sigma\,dr=\frac12MR^2.$$

> 圆环的转动惯量是 $MR^2$，实心圆盘因质量向中心分布而减半。`,
      answer: T`$I=\frac12MR^2$`
    },
    {
      id: 'osc-1', chapter: 'oscillation', level: 1, title: '弹簧振子周期',
      question: T`质量 $0.5\,\mathrm{kg}$ 的物体连接劲度系数 $k=50\,\mathrm{N/m}$ 的弹簧，求振动周期。`,
      hint: T`$T=2\pi\sqrt{m/k}$。`,
      solution: T`$$T=2\pi\sqrt{\frac{0.5}{50}}=2\pi\sqrt{0.01}=\frac{\pi}{5}\,\mathrm{s}\approx0.628\,\mathrm{s}.$$`,
      answer: T`$T=\frac{\pi}{5}\,\mathrm{s}$`
    },
    {
      id: 'thermo-1', chapter: 'thermo', level: 1, title: '等容吸热',
      question: T`一定量理想气体在等容过程中吸热 $200\,\mathrm{J}$，求内能变化和做功。`,
      hint: T`等容过程 $W=0$，第一定律 $\Delta U=Q+W$。`,
      solution: T`等容：$W=0$，所以
$$\Delta U=Q=200\,\mathrm{J}.$$

> 注意符号约定：这里 $W$ 为外界对气体做功。`,
      answer: T`$\Delta U=200\,\mathrm{J},\ W=0$`
    },
    {
      id: 'thermo-2', chapter: 'thermo', level: 2, title: '卡诺效率',
      question: T`卡诺热机工作在 $500\,\mathrm{K}$ 和 $300\,\mathrm{K}$ 之间，求效率。`,
      hint: T`$\eta=1-T_2/T_1$。`,
      solution: T`$$\eta=1-\frac{300}{500}=0.4=40\%.$$`,
      answer: T`$\eta=40\%$`
    },
    {
      id: 'e-1', chapter: 'electrostatics', level: 1, title: '点电荷电场',
      question: T`点电荷 $q=2\times10^{-6}\,\mathrm{C}$，求距它 $0.1\,\mathrm{m}$ 处的电场强度大小，取 $k=9\times10^9$。`,
      hint: T`$E=kq/r^2$。`,
      solution: T`$$E=9\times10^9\times\frac{2\times10^{-6}}{0.1^2}=1.8\times10^6\,\mathrm{N/C}.$$`,
      answer: T`$E=1.8\times10^6\,\mathrm{N/C}$`
    },
    {
      id: 'b-1', chapter: 'magnetism', level: 1, title: '长直导线磁场',
      question: T`长直导线通有 $5\,\mathrm{A}$ 电流，求距导线 $0.2\,\mathrm{m}$ 处的磁感应强度，取 $\mu_0=4\pi\times10^{-7}$。`,
      hint: T`$B=\mu_0I/(2\pi r)$。`,
      solution: T`$$B=\frac{4\pi\times10^{-7}\times5}{2\pi\times0.2}=5\times10^{-6}\,\mathrm{T}.$$`,
      answer: T`$B=5\times10^{-6}\,\mathrm{T}$`
    },
    {
      id: 'opt-1', chapter: 'optics', level: 2, title: '双缝干涉条纹间距',
      question: T`双缝间距 $0.2\,\mathrm{mm}$，屏距 $1\,\mathrm{m}$，光波长 $500\,\mathrm{nm}$，求相邻明纹间距。`,
      hint: T`$\Delta x=D\lambda/d$。`,
      solution: T`$$\Delta x=\frac{1\times500\times10^{-9}}{0.2\times10^{-3}}=2.5\times10^{-3}\,\mathrm{m}=2.5\,\mathrm{mm}.$$`,
      answer: T`$\Delta x=2.5\,\mathrm{mm}$`
    },
    {
      id: 'mod-1', chapter: 'modern', level: 1, title: '光子能量',
      question: T`波长 $500\,\mathrm{nm}$ 的光子能量约为多少？取 $h=6.63\times10^{-34}\,\mathrm{J\cdot s}$，$c=3\times10^8\,\mathrm{m/s}$。`,
      hint: T`$E=hc/\lambda$。`,
      solution: T`$$E=\frac{6.63\times10^{-34}\times3\times10^8}{500\times10^{-9}}\approx3.98\times10^{-19}\,\mathrm{J}.$$

换算成电子伏约 $2.49\,\mathrm{eV}$。`,
      answer: T`$E\approx3.98\times10^{-19}\,\mathrm{J}$`
    }
  ];

  window.CALC_DATA = { CHAPTERS, QUESTIONS };
})();
