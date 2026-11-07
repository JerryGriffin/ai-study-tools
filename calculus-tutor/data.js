/* 高数答疑室 · 本地课程数据
 * 章节、公式卡片与练习题库。所有公式均为 LaTeX 源串。
 */
(function () {
  'use strict';
  const T = String.raw;

  const CHAPTERS = [
    {
      id: 'limits',
      index: 1,
      name: '极限与连续',
      glyph: 'lim',
      short: '极限',
      intro: '极限是整个微积分的地基：导数、积分、级数都靠它定义。',
      keywords: ['极限', '连续', '无穷小', '洛必达', '等价无穷小', '夹逼', '间断点', '渐近线'],
      formulas: [
        { name: '两个重要极限', tex: T`\lim_{x\to 0}\frac{\sin x}{x}=1,\qquad \lim_{x\to\infty}\left(1+\frac{1}{x}\right)^{x}=e` },
        { name: '等价无穷小（x→0）', tex: T`\sin x\sim x,\ \tan x\sim x,\ 1-\cos x\sim \frac{x^{2}}{2},\ \ln(1+x)\sim x,\ e^{x}-1\sim x` },
        { name: '洛必达法则', tex: T`\lim\frac{f(x)}{g(x)}=\lim\frac{f'(x)}{g'(x)}\quad\left(\frac{0}{0}\ \text{或}\ \frac{\infty}{\infty}\right)` },
        { name: '连续的定义', tex: T`\lim_{x\to x_{0}}f(x)=f(x_{0})` },
        { name: '常用泰勒展开', tex: T`\sin x=x-\frac{x^{3}}{6}+o(x^{3}),\quad e^{x}=1+x+\frac{x^{2}}{2}+o(x^{2})` }
      ],
      prompts: [
        'lim(x→0) (1-cos x)/x² 怎么算？',
        '等价无穷小什么时候不能替换？',
        '怎么判断间断点的类型？'
      ]
    },
    {
      id: 'derivative',
      index: 2,
      name: '导数与微分',
      glyph: "f′",
      short: '导数',
      intro: '导数刻画瞬时变化率。会算，更要会解释它在题目里代表什么。',
      keywords: ['导数', '微分', '求导', '隐函数', '参数方程', '高阶导数', '切线', '法线', '变化率'],
      formulas: [
        { name: '导数定义', tex: T`f'(x_{0})=\lim_{\Delta x\to 0}\frac{f(x_{0}+\Delta x)-f(x_{0})}{\Delta x}` },
        { name: '乘除与复合', tex: T`(uv)'=u'v+uv',\quad \left(\frac{u}{v}\right)'=\frac{u'v-uv'}{v^{2}},\quad \frac{dy}{dx}=\frac{dy}{du}\frac{du}{dx}` },
        { name: '基本导数表', tex: T`(x^{a})'=ax^{a-1},\ (e^{x})'=e^{x},\ (\ln x)'=\frac{1}{x},\ (\sin x)'=\cos x` },
        { name: '隐函数求导', tex: T`F(x,y)=0\ \Rightarrow\ \frac{dy}{dx}=-\frac{F_{x}}{F_{y}}` },
        { name: '参数方程求导', tex: T`\frac{dy}{dx}=\frac{dy/dt}{dx/dt},\qquad \frac{d^{2}y}{dx^{2}}=\frac{d}{dt}\left(\frac{dy}{dx}\right)\Big/\frac{dx}{dt}` }
      ],
      prompts: [
        '隐函数求导总是漏项怎么办？',
        '参数方程的二阶导数怎么求？',
        '可导和连续是什么关系？'
      ]
    },
    {
      id: 'mvt',
      index: 3,
      name: '中值定理与导数应用',
      glyph: 'ξ',
      short: '中值定理',
      intro: '罗尔、拉格朗日、柯西、泰勒：证明题的四大抓手，也是单调性与极值的依据。',
      keywords: ['中值定理', '罗尔', '拉格朗日', '柯西', '泰勒', '单调', '极值', '最值', '凹凸', '拐点', '不等式证明'],
      formulas: [
        { name: '罗尔定理', tex: T`f(a)=f(b)\ \Rightarrow\ \exists\,\xi\in(a,b),\ f'(\xi)=0` },
        { name: '拉格朗日中值定理', tex: T`f(b)-f(a)=f'(\xi)(b-a),\quad \xi\in(a,b)` },
        { name: '柯西中值定理', tex: T`\frac{f(b)-f(a)}{g(b)-g(a)}=\frac{f'(\xi)}{g'(\xi)}` },
        { name: '单调性与极值', tex: T`f'(x)>0\Rightarrow\text{递增},\qquad f'(x_{0})=0,\ f''(x_{0})<0\Rightarrow\text{极大}` },
        { name: '泰勒公式（拉格朗日余项）', tex: T`f(x)=\sum_{k=0}^{n}\frac{f^{(k)}(x_{0})}{k!}(x-x_{0})^{k}+\frac{f^{(n+1)}(\xi)}{(n+1)!}(x-x_{0})^{n+1}` }
      ],
      prompts: [
        '拉格朗日中值定理怎么构造函数？',
        '凹凸性和拐点怎么判断？',
        '泰勒公式和洛必达该怎么选？'
      ]
    },
    {
      id: 'indefinite',
      index: 4,
      name: '不定积分',
      glyph: '∫',
      short: '不定积分',
      intro: '求导的逆运算。换元看结构，分部看乘积，最后别忘了 +C。',
      keywords: ['不定积分', '原函数', '换元', '分部积分', '有理函数', '三角代换', '凑微分'],
      formulas: [
        { name: '基本积分表', tex: T`\int x^{a}dx=\frac{x^{a+1}}{a+1}+C\ (a\ne-1),\quad \int\frac{dx}{x}=\ln|x|+C` },
        { name: '指数与三角', tex: T`\int e^{x}dx=e^{x}+C,\quad \int\sin x\,dx=-\cos x+C,\quad \int\cos x\,dx=\sin x+C` },
        { name: '第一类换元（凑微分）', tex: T`\int f(\varphi(x))\varphi'(x)\,dx=\int f(u)\,du` },
        { name: '分部积分', tex: T`\int u\,dv=uv-\int v\,du` },
        { name: '常用结构', tex: T`\int\frac{dx}{x^{2}+a^{2}}=\frac{1}{a}\arctan\frac{x}{a}+C` }
      ],
      prompts: [
        '分部积分怎么选 u 和 dv？',
        '有理函数积分怎么拆项？',
        '第一换元法和第二换元法怎么区分？'
      ]
    },
    {
      id: 'definite',
      index: 5,
      name: '定积分及其应用',
      glyph: '∫ₐᵇ',
      short: '定积分',
      intro: '从“分割—近似—求和—取极限”到牛顿-莱布尼茨公式，再到面积、体积、弧长。',
      keywords: ['定积分', '牛顿-莱布尼茨', '变上限', '面积', '体积', '弧长', '反常积分', '旋转体'],
      formulas: [
        { name: '牛顿-莱布尼茨公式', tex: T`\int_{a}^{b}f(x)\,dx=F(b)-F(a)` },
        { name: '变上限积分求导', tex: T`\frac{d}{dx}\int_{a}^{\varphi(x)}f(t)\,dt=f(\varphi(x))\varphi'(x)` },
        { name: '平面图形面积', tex: T`A=\int_{a}^{b}\left|f(x)-g(x)\right|dx` },
        { name: '旋转体体积', tex: T`V_{x}=\pi\int_{a}^{b}y^{2}\,dx,\qquad V_{y}=2\pi\int_{a}^{b}x\,f(x)\,dx` },
        { name: '弧长与反常积分', tex: T`s=\int_{a}^{b}\sqrt{1+(y')^{2}}\,dx,\qquad \int_{a}^{+\infty}f(x)dx=\lim_{b\to+\infty}\int_{a}^{b}f(x)dx` }
      ],
      prompts: [
        '定积分的几何应用怎么列式？',
        '反常积分的收敛性怎么判断？',
        '变上限积分函数怎么求导？'
      ]
    },
    {
      id: 'multivariable',
      index: 6,
      name: '多元函数微分学',
      glyph: '∂',
      short: '多元微分',
      intro: '偏导、全微分、方向导数与梯度，以及无条件极值。核心是“固定其他变量”。',
      keywords: ['偏导数', '全微分', '方向导数', '梯度', '多元函数', '极值', '切平面', '链式法则'],
      formulas: [
        { name: '全微分', tex: T`dz=\frac{\partial z}{\partial x}dx+\frac{\partial z}{\partial y}dy` },
        { name: '链式法则', tex: T`\frac{\partial z}{\partial t}=\frac{\partial z}{\partial x}\frac{\partial x}{\partial t}+\frac{\partial z}{\partial y}\frac{\partial y}{\partial t}` },
        { name: '方向导数与梯度', tex: T`\frac{\partial f}{\partial \mathbf{l}}=\nabla f\cdot \mathbf{e}_{l},\qquad \nabla f=(f_{x},f_{y})` },
        { name: '切平面', tex: T`z-z_{0}=f_{x}(x_{0},y_{0})(x-x_{0})+f_{y}(x_{0},y_{0})(y-y_{0})` },
        { name: '极值必要条件', tex: T`f_{x}=f_{y}=0,\qquad D=f_{xx}f_{yy}-f_{xy}^{2}` }
      ],
      prompts: [
        '全微分和偏导数是什么关系？',
        '方向导数最大的方向怎么找？',
        '二元函数极值怎么判定？'
      ]
    },
    {
      id: 'multiple',
      index: 7,
      name: '重积分',
      glyph: '∬',
      short: '重积分',
      intro: '二重、三重积分的关键只有两步：画区域，定积分限。换元时别忘记雅可比。',
      keywords: ['二重积分', '三重积分', '极坐标', '柱坐标', '球坐标', '交换积分次序', '雅可比'],
      formulas: [
        { name: '二重积分（直角坐标）', tex: T`\iint_{D}f(x,y)\,dA=\int_{a}^{b}dx\int_{y_{1}(x)}^{y_{2}(x)}f(x,y)\,dy` },
        { name: '极坐标', tex: T`\iint_{D}f(x,y)\,dxdy=\iint_{D'}f(r\cos\theta,r\sin\theta)\,r\,dr\,d\theta` },
        { name: '三重积分（柱坐标）', tex: T`\iiint_{\Omega}f\,dV=\iiint f(r\cos\theta,r\sin\theta,z)\,r\,dr\,d\theta\,dz` },
        { name: '球坐标', tex: T`\iiint_{\Omega}f\,dV=\iiint f(\rho\sin\varphi\cos\theta,\rho\sin\varphi\sin\theta,\rho\cos\varphi)\,\rho^{2}\sin\varphi\,d\rho\,d\varphi\,d\theta` },
        { name: '交换次序', tex: T`\int_{0}^{1}dx\int_{x}^{1}f\,dy=\int_{0}^{1}dy\int_{0}^{y}f\,dx` }
      ],
      prompts: [
        '极坐标换元什么时候用？',
        '交换积分次序怎么画区域？',
        '三重积分用柱坐标怎么定限？'
      ]
    },
    {
      id: 'line-surface',
      index: 8,
      name: '曲线与曲面积分',
      glyph: '∮',
      short: '曲线曲面',
      intro: '第一类看弧长/面积，第二类看方向；格林、高斯、斯托克斯把边界上的积分变成内部的积分。',
      keywords: ['曲线积分', '曲面积分', '格林公式', '高斯公式', '斯托克斯', '通量', '环流量', '散度', '旋度'],
      formulas: [
        { name: '第一类曲线积分', tex: T`\int_{L}f(x,y)\,ds=\int_{a}^{b}f(x(t),y(t))\sqrt{x'^{2}+y'^{2}}\,dt` },
        { name: '第二类曲线积分', tex: T`\int_{L}P\,dx+Q\,dy=\int_{a}^{b}\left(Px'+Qy'\right)dt` },
        { name: '格林公式', tex: T`\oint_{L}P\,dx+Q\,dy=\iint_{D}\left(\frac{\partial Q}{\partial x}-\frac{\partial P}{\partial y}\right)dxdy` },
        { name: '高斯公式', tex: T`\oiint_{\Sigma}\mathbf{F}\cdot\mathbf{n}\,dS=\iiint_{\Omega}\nabla\cdot\mathbf{F}\,dV` },
        { name: '斯托克斯公式', tex: T`\oint_{\Gamma}\mathbf{F}\cdot d\mathbf{r}=\iint_{\Sigma}(\nabla\times\mathbf{F})\cdot\mathbf{n}\,dS` }
      ],
      prompts: [
        '格林公式的使用条件是什么？',
        '第一类曲线积分怎么算？',
        '高斯公式补面怎么处理？'
      ]
    },
    {
      id: 'series',
      index: 9,
      name: '无穷级数',
      glyph: 'Σ',
      short: '级数',
      intro: '先看通项是否趋于 0，再选判别法；幂级数抓住收敛半径，展开式记住五个就够用。',
      keywords: ['级数', '收敛', '发散', '比值判别', 'p级数', '交错级数', '幂级数', '收敛半径', '傅里叶'],
      formulas: [
        { name: '几何级数', tex: T`\sum_{n=0}^{\infty}q^{n}=\frac{1}{1-q}\quad(|q|<1)` },
        { name: 'p 级数', tex: T`\sum_{n=1}^{\infty}\frac{1}{n^{p}}\ \text{收敛}\iff p>1` },
        { name: '比值判别法', tex: T`\lim_{n\to\infty}\left|\frac{a_{n+1}}{a_{n}}\right|=\rho:\ \rho<1\ \text{收敛},\ \rho>1\ \text{发散}` },
        { name: '莱布尼茨判别法', tex: T`a_{n}\downarrow 0\ \Rightarrow\ \sum(-1)^{n}a_{n}\ \text{收敛}` },
        { name: '常用展开式', tex: T`e^{x}=\sum_{n=0}^{\infty}\frac{x^{n}}{n!},\quad \frac{1}{1-x}=\sum_{n=0}^{\infty}x^{n},\quad \ln(1+x)=\sum_{n=1}^{\infty}\frac{(-1)^{n-1}x^{n}}{n}` }
      ],
      prompts: [
        '怎么快速判断级数的敛散性？',
        '幂级数的收敛半径怎么求？',
        '傅里叶级数需要背哪些公式？'
      ]
    },
    {
      id: 'ode',
      index: 10,
      name: '常微分方程',
      glyph: 'dy/dx',
      short: '微分方程',
      intro: '识别类型 → 选择方法 → 代初值。可分离、一阶线性、二阶常系数是考试主线。',
      keywords: ['微分方程', '通解', '特解', '可分离', '一阶线性', '二阶常系数', '特征方程', '初值问题'],
      formulas: [
        { name: '可分离变量', tex: T`\frac{dy}{dx}=f(x)g(y)\ \Rightarrow\ \int\frac{dy}{g(y)}=\int f(x)\,dx` },
        { name: '一阶线性方程', tex: T`y'+P(x)y=Q(x)\ \Rightarrow\ y=e^{-\int P dx}\left(\int Qe^{\int P dx}dx+C\right)` },
        { name: '二阶常系数齐次', tex: T`y''+py'+qy=0\ \Rightarrow\ r^{2}+pr+q=0` },
        { name: '特征根三种情形', tex: T`r_{1}\ne r_{2}:\ C_{1}e^{r_{1}x}+C_{2}e^{r_{2}x};\quad r_{1}=r_{2}:\ (C_{1}+C_{2}x)e^{rx}` },
        { name: '共轭复根', tex: T`r=\alpha\pm\beta i:\ y=e^{\alpha x}(C_{1}\cos\beta x+C_{2}\sin\beta x)` }
      ],
      prompts: [
        '一阶线性微分方程的公式怎么推？',
        '二阶常系数非齐次的特解怎么设？',
        '可降阶的微分方程有哪几类？'
      ]
    }
  ];

  const QUESTIONS = [
    /* ---------- 极限与连续 ---------- */
    {
      id: 'lim-1', chapter: 'limits', level: 1, title: '等价无穷小求极限',
      question: T`求 $\displaystyle \lim_{x\to 0}\frac{\sin 3x}{\tan 5x}$。`,
      hint: T`当 $x\to 0$ 时，$\sin 3x\sim 3x$，$\tan 5x\sim 5x$。先确认它们都是乘积因子，再替换。`,
      solution: T`**第一步：识别结构。** 分子、分母都是无穷小，且各自是独立的乘积因子，可以使用等价无穷小替换。

**第二步：替换。** 当 $x\to0$ 时，
$$\sin 3x\sim 3x,\qquad \tan 5x\sim 5x.$$

**第三步：求值。**
$$\lim_{x\to0}\frac{\sin 3x}{\tan 5x}=\lim_{x\to0}\frac{3x}{5x}=\frac35.$$

> 易错点：等价无穷小只能替换乘除因子。若出现在加减法中（如 $\sin x-x$），直接替换会丢失高阶项，需要泰勒展开。`,
      answer: T`$\dfrac{3}{5}$`
    },
    {
      id: 'lim-2', chapter: 'limits', level: 2, title: '凑第二个重要极限',
      question: T`求 $\displaystyle \lim_{x\to\infty}\left(1+\frac{2}{x}\right)^{3x}$。`,
      hint: T`把指数拆成 $\frac{x}{2}\cdot 6$，先凑出 $\left(1+\frac{2}{x}\right)^{x/2}\to e$。`,
      solution: T`**第一步：凑标准形式。** 令 $t=\frac{x}{2}$，则 $x=2t$，且 $t\to\infty$：
$$\left(1+\frac{2}{x}\right)^{3x}=\left[\left(1+\frac{1}{t}\right)^{t}\right]^{6}.$$

**第二步：用重要极限。** 方括号内趋于 $e$，因此
$$\lim_{x\to\infty}\left(1+\frac{2}{x}\right)^{3x}=e^{6}.$$

> 一般结论：$\displaystyle\lim_{x\to\infty}\left(1+\frac{a}{x}\right)^{bx}=e^{ab}$。`,
      answer: T`$e^{6}$`
    },
    {
      id: 'lim-3', chapter: 'limits', level: 1, title: '1−cos x 的等价无穷小',
      question: T`求 $\displaystyle \lim_{x\to 0}\frac{1-\cos x}{x^{2}}$。`,
      hint: T`记住 $1-\cos x\sim \frac{x^{2}}{2}$；也可以用 $1-\cos x=2\sin^{2}\frac{x}{2}$ 推导。`,
      solution: T`**方法一：等价无穷小。** 当 $x\to0$ 时，$1-\cos x\sim\dfrac{x^{2}}{2}$，所以
$$\lim_{x\to0}\frac{1-\cos x}{x^{2}}=\lim_{x\to0}\frac{x^{2}/2}{x^{2}}=\frac12.$$

**方法二：半角公式。**
$$1-\cos x=2\sin^{2}\frac{x}{2},\qquad
\lim_{x\to0}\frac{2\sin^{2}(x/2)}{x^{2}}
=2\left(\frac12\right)^{2}=\frac12.$$

> 记忆：$1-\cos x$ 是二阶无穷小，这也是它常与 $x^{2}$ 比较的原因。`,
      answer: T`$\dfrac{1}{2}$`
    },

    /* ---------- 导数与微分 ---------- */
    {
      id: 'der-1', chapter: 'derivative', level: 1, title: '乘积法则',
      question: T`设 $y=x^{2}e^{x}$，求 $y'$。`,
      hint: T`这是乘积，用 $(uv)'=u'v+uv'$，其中 $u=x^{2}$，$v=e^{x}$。`,
      solution: T`**第一步：套乘积法则。**
$$y'=(x^{2})'e^{x}+x^{2}(e^{x})'.$$

**第二步：代入基本导数。**
$$y'=2xe^{x}+x^{2}e^{x}=e^{x}\left(x^{2}+2x\right).$$

**第三步：整理。** 也可以写成 $y'=x(x+2)e^{x}$。`,
      answer: T`$y'=e^{x}(x^{2}+2x)$`
    },
    {
      id: 'der-2', chapter: 'derivative', level: 2, title: '参数方程求导',
      question: T`设 $\begin{cases}x=t-\sin t,\\ y=1-\cos t,\end{cases}$ 求 $\dfrac{dy}{dx}$。`,
      hint: T`先分别对 $t$ 求导，再用 $\dfrac{dy}{dx}=\dfrac{dy/dt}{dx/dt}$。`,
      solution: T`**第一步：对参数求导。**
$$\frac{dx}{dt}=1-\cos t,\qquad \frac{dy}{dt}=\sin t.$$

**第二步：相除。**
$$\frac{dy}{dx}=\frac{\sin t}{1-\cos t}.$$

**第三步：化简。** 用半角公式：
$$\frac{2\sin\frac t2\cos\frac t2}{2\sin^{2}\frac t2}=\cot\frac t2
\qquad(t\ne 2k\pi).$$

> 注意：参数方程的二阶导不是简单地对 $\frac{dy}{dx}$ 再除以 $\frac{dx}{dt}$，而要先对 $t$ 求导再除以 $\frac{dx}{dt}$。`,
      answer: T`$\dfrac{dy}{dx}=\cot\dfrac{t}{2}$`
    },
    {
      id: 'der-3', chapter: 'derivative', level: 1, title: '隐函数求导',
      question: T`设 $x^{2}+y^{2}=1$，求 $\dfrac{dy}{dx}$。`,
      hint: T`把 $y$ 看作 $x$ 的函数，两边同时对 $x$ 求导，遇到 $y$ 时记得乘 $y'$。`,
      solution: T`**第一步：两边对 $x$ 求导。**
$$\frac{d}{dx}(x^{2}+y^{2})=\frac{d}{dx}(1)
\ \Rightarrow\ 2x+2y\,y'=0.$$

**第二步：解出 $y'$。**
$$y'=-\frac{x}{y}\qquad(y\ne0).$$

**第三步：几何解释。** 圆上点 $(x,y)$ 处切线的法向量是 $(x,y)$，所以切线斜率为 $-x/y$，与结果一致。

> 在 $(0,\pm1)$ 处切线水平，$y'=0$；在 $(\pm1,0)$ 处切线竖直，导数不存在。`,
      answer: T`$y'=-\dfrac{x}{y}$`
    },

    /* ---------- 中值定理与导数应用 ---------- */
    {
      id: 'mvt-1', chapter: 'mvt', level: 2, title: '用拉格朗日定理证明不等式',
      question: T`证明：当 $x>0$ 时，$\ln(1+x)<x$。`,
      hint: T`对 $f(t)=\ln(1+t)$ 在区间 $[0,x]$ 上用拉格朗日中值定理，并估计 $\frac{1}{1+\xi}$。`,
      solution: T`**第一步：构造函数。** 令 $f(t)=\ln(1+t)$，它在 $[0,x]$ 上连续、在 $(0,x)$ 内可导，且 $f(0)=0$。

**第二步：用拉格朗日中值定理。** 存在 $\xi\in(0,x)$，使
$$\ln(1+x)-\ln 1=\frac{1}{1+\xi}\,x.$$

**第三步：估计。** 因为 $\xi>0$，所以 $0<\frac{1}{1+\xi}<1$，从而
$$\ln(1+x)=\frac{x}{1+\xi}<x.$$

> 证明不等式的常见套路：把待证式整理成 $f(b)-f(a)$ 的形式，再对 $f$ 用中值定理。`,
      answer: T`得证：$\ln(1+x)<x\ (x>0)$`
    },
    {
      id: 'mvt-2', chapter: 'mvt', level: 1, title: '单调区间与极值',
      question: T`求 $f(x)=x^{3}-3x^{2}+2$ 的单调区间与极值。`,
      hint: T`先求 $f'(x)=3x(x-2)$，再画符号表。`,
      solution: T`**第一步：求导并找驻点。**
$$f'(x)=3x^{2}-6x=3x(x-2),$$
驻点为 $x=0$ 和 $x=2$。

**第二步：判断符号。**

| 区间 | $(-\infty,0)$ | $(0,2)$ | $(2,+\infty)$ |
| --- | --- | --- | --- |
| $f'(x)$ | $+$ | $-$ | $+$ |
| $f(x)$ | 递增 | 递减 | 递增 |

**第三步：求极值。**
$$f(0)=2\ \text{（极大值）},\qquad f(2)=8-12+2=-2\ \text{（极小值）}.$$

所以递增区间为 $(-\infty,0)$ 与 $(2,+\infty)$，递减区间为 $(0,2)$。`,
      answer: T`极大值 $f(0)=2$，极小值 $f(2)=-2$`
    },
    {
      id: 'mvt-3', chapter: 'mvt', level: 2, title: '泰勒展开求极限',
      question: T`求 $\displaystyle \lim_{x\to 0}\frac{x-\sin x}{x^{3}}$。`,
      hint: T`把 $\sin x$ 展开到 $x^{3}$ 项：$\sin x=x-\frac{x^{3}}{6}+o(x^{3})$。`,
      solution: T`**第一步：泰勒展开。**
$$\sin x=x-\frac{x^{3}}{6}+o(x^{3}).$$

**第二步：代入。**
$$x-\sin x=\frac{x^{3}}{6}+o(x^{3}).$$

**第三步：求极限。**
$$\lim_{x\to0}\frac{x-\sin x}{x^{3}}
=\lim_{x\to0}\left(\frac16+\frac{o(x^{3})}{x^{3}}\right)=\frac16.$$

> 若用洛必达法则，需要连续求导三次；泰勒展开通常更快，但要注意展开阶数要与分母匹配。`,
      answer: T`$\dfrac{1}{6}$`
    },

    /* ---------- 不定积分 ---------- */
    {
      id: 'int-1', chapter: 'indefinite', level: 1, title: '凑微分',
      question: T`求 $\displaystyle \int x e^{x^{2}}\,dx$。`,
      hint: T`注意到 $d(x^{2})=2x\,dx$，令 $u=x^{2}$。`,
      solution: T`**第一步：换元。** 令 $u=x^{2}$，则 $du=2x\,dx$，即 $x\,dx=\frac12 du$。

**第二步：积分。**
$$\int xe^{x^{2}}dx=\frac12\int e^{u}du=\frac12e^{u}+C.$$

**第三步：回代。**
$$\int xe^{x^{2}}dx=\frac12e^{x^{2}}+C.$$

> 验算：$\left(\frac12e^{x^{2}}\right)'=\frac12 e^{x^{2}}\cdot 2x=xe^{x^{2}}$。`,
      answer: T`$\dfrac{1}{2}e^{x^{2}}+C$`
    },
    {
      id: 'int-2', chapter: 'indefinite', level: 2, title: '分部积分',
      question: T`求 $\displaystyle \int \ln x\,dx$。`,
      hint: T`把 $\ln x$ 看成 $u$，把 $dx$ 看成 $dv$。`,
      solution: T`**第一步：设 $u$ 与 $dv$。**
$$u=\ln x,\quad dv=dx
\ \Rightarrow\ du=\frac1x dx,\quad v=x.$$

**第二步：分部积分。**
$$\int\ln x\,dx=x\ln x-\int x\cdot\frac1x\,dx
=x\ln x-\int 1\,dx.$$

**第三步：整理。**
$$\int\ln x\,dx=x\ln x-x+C.$$

> 口诀“反对幂指三”：反三角、对数优先做 $u$，指数、三角优先做 $dv$。`,
      answer: T`$x\ln x-x+C$`
    },
    {
      id: 'int-3', chapter: 'indefinite', level: 1, title: '标准反正切积分',
      question: T`求 $\displaystyle \int\frac{dx}{x^{2}+a^{2}}\quad(a\ne0)$。`,
      hint: T`提出 $a^{2}$，凑成 $\frac{1}{1+(x/a)^{2}}$ 的形式。`,
      solution: T`**第一步：变形。**
$$\int\frac{dx}{x^{2}+a^{2}}
=\frac{1}{a^{2}}\int\frac{dx}{1+(x/a)^{2}}.$$

**第二步：换元。** 令 $u=\frac xa$，$dx=a\,du$：
$$\frac{1}{a^{2}}\int\frac{a\,du}{1+u^{2}}
=\frac1a\arctan u+C.$$

**第三步：回代。**
$$\int\frac{dx}{x^{2}+a^{2}}=\frac1a\arctan\frac xa+C.$$

> 当 $a=1$ 时就是 $\arctan x+C$。`,
      answer: T`$\dfrac{1}{a}\arctan\dfrac{x}{a}+C$`
    },

    /* ---------- 定积分及其应用 ---------- */
    {
      id: 'def-1', chapter: 'definite', level: 1, title: '牛顿-莱布尼茨公式',
      question: T`求 $\displaystyle \int_{0}^{1}x^{2}\,dx$。`,
      hint: T`先找原函数 $\frac{x^{3}}{3}$，再代上下限。`,
      solution: T`**第一步：求原函数。**
$$\int x^{2}dx=\frac{x^{3}}{3}+C.$$

**第二步：用牛顿-莱布尼茨公式。**
$$\int_{0}^{1}x^{2}dx=\left[\frac{x^{3}}{3}\right]_{0}^{1}
=\frac13-0=\frac13.$$

> 定积分是一个数，不定积分是一族函数。计算定积分时不需要写 $+C$。`,
      answer: T`$\dfrac{1}{3}$`
    },
    {
      id: 'def-2', chapter: 'definite', level: 2, title: '两曲线围成的面积',
      question: T`求曲线 $y=x$ 与 $y=x^{2}$ 在 $[0,1]$ 上所围图形的面积。`,
      hint: T`先求交点，再判断在 $(0,1)$ 内哪条曲线在上方：$x>x^{2}$。`,
      solution: T`**第一步：找交点。** 解 $x=x^{2}$ 得 $x=0,1$。

**第二步：确定上下方。** 在 $(0,1)$ 内 $x>x^{2}$，所以面积
$$A=\int_{0}^{1}\left(x-x^{2}\right)dx.$$

**第三步：计算。**
$$A=\left[\frac{x^{2}}{2}-\frac{x^{3}}{3}\right]_{0}^{1}
=\frac12-\frac13=\frac16.$$

> 列式前一定先画草图，确认“上减下”。如果上下关系在区间内改变，要分段积分。`,
      answer: T`$\dfrac{1}{6}$`
    },
    {
      id: 'def-3', chapter: 'definite', level: 2, title: '无穷区间上的反常积分',
      question: T`判断并计算 $\displaystyle \int_{0}^{+\infty}e^{-2x}\,dx$。`,
      hint: T`按定义写成 $\lim_{b\to+\infty}\int_{0}^{b}e^{-2x}dx$。`,
      solution: T`**第一步：按定义处理。**
$$\int_{0}^{+\infty}e^{-2x}dx
=\lim_{b\to+\infty}\int_{0}^{b}e^{-2x}dx.$$

**第二步：求原函数并代入。**
$$\int e^{-2x}dx=-\frac12e^{-2x}+C,$$
所以
$$\int_{0}^{b}e^{-2x}dx
=\left[-\frac12e^{-2x}\right]_{0}^{b}
=\frac12\left(1-e^{-2b}\right).$$

**第三步：取极限。** 当 $b\to+\infty$ 时 $e^{-2b}\to0$，故
$$\int_{0}^{+\infty}e^{-2x}dx=\frac12.$$

> 结论：$\int_{0}^{+\infty}e^{-px}dx=\frac1p\ (p>0)$，收敛。`,
      answer: T`收敛，值为 $\dfrac{1}{2}$`
    },

    /* ---------- 多元函数微分学 ---------- */
    {
      id: 'multi-1', chapter: 'multivariable', level: 1, title: '偏导数计算',
      question: T`设 $z=x^{2}y+\sin(xy)$，求 $\dfrac{\partial z}{\partial x}$ 与 $\dfrac{\partial z}{\partial y}$。`,
      hint: T`对 $x$ 求偏导时把 $y$ 当常数；对 $y$ 求偏导时把 $x$ 当常数。`,
      solution: T`**对 $x$ 求偏导（$y$ 为常数）：**
$$\frac{\partial z}{\partial x}=2xy+\cos(xy)\cdot y
=2xy+y\cos(xy).$$

**对 $y$ 求偏导（$x$ 为常数）：**
$$\frac{\partial z}{\partial y}=x^{2}+\cos(xy)\cdot x
=x^{2}+x\cos(xy).$$

> 复合部分 $\sin(xy)$ 要用链式法则，内层对 $x$ 或 $y$ 的导数分别是 $y$ 或 $x$。`,
      answer: T`$z_{x}=2xy+y\cos(xy),\ z_{y}=x^{2}+x\cos(xy)$`
    },
    {
      id: 'multi-2', chapter: 'multivariable', level: 2, title: '方向导数',
      question: T`求 $z=x^{2}+y^{2}$ 在点 $(1,1)$ 处沿方向 $\mathbf{l}=(1,1)$ 的方向导数。`,
      hint: T`先求梯度 $\nabla z=(2x,2y)$，再把方向单位化，最后做点积。`,
      solution: T`**第一步：求梯度。**
$$\nabla z=(2x,2y)\ \Rightarrow\ \nabla z(1,1)=(2,2).$$

**第二步：单位化方向。**
$$\mathbf{e}_{l}=\frac{(1,1)}{\sqrt{2}}
=\left(\frac{1}{\sqrt2},\frac{1}{\sqrt2}\right).$$

**第三步：点积。**
$$\frac{\partial z}{\partial \mathbf{l}}
=\nabla z\cdot\mathbf{e}_{l}
=2\cdot\frac{1}{\sqrt2}+2\cdot\frac{1}{\sqrt2}
=2\sqrt2.$$

> 梯度方向是方向导数最大的方向，最大值就是 $|\nabla z|=\sqrt{8}=2\sqrt2$。`,
      answer: T`$2\sqrt{2}$`
    },
    {
      id: 'multi-3', chapter: 'multivariable', level: 2, title: '二元函数极值',
      question: T`求 $f(x,y)=x^{2}+y^{2}-2x-4y$ 的极值。`,
      hint: T`先解 $f_{x}=0,\ f_{y}=0$，再用海森矩阵判定。`,
      solution: T`**第一步：求驻点。**
$$f_{x}=2x-2=0\ \Rightarrow\ x=1,\qquad
f_{y}=2y-4=0\ \Rightarrow\ y=2.$$
唯一驻点为 $(1,2)$。

**第二步：二阶偏导。**
$$f_{xx}=2,\quad f_{yy}=2,\quad f_{xy}=0,$$
海森矩阵 $H=\begin{pmatrix}2&0\\0&2\end{pmatrix}$ 正定。

**第三步：结论。** $(1,2)$ 为极小值点，
$$f(1,2)=1+4-2-8=-5.$$

> 也可以配方：$f=(x-1)^{2}+(y-2)^{2}-5$，最小值一目了然。`,
      answer: T`极小值 $f(1,2)=-5$`
    },

    /* ---------- 重积分 ---------- */
    {
      id: 'mul-1', chapter: 'multiple', level: 1, title: '矩形区域上的二重积分',
      question: T`计算 $\displaystyle \iint_{D}(x+y)\,dA$，其中 $D=[0,1]\times[0,1]$。`,
      hint: T`矩形区域可以直接化为累次积分，先对 $y$ 后对 $x$。`,
      solution: T`**第一步：写成累次积分。**
$$\iint_{D}(x+y)\,dA
=\int_{0}^{1}dx\int_{0}^{1}(x+y)\,dy.$$

**第二步：内层积分。**
$$\int_{0}^{1}(x+y)dy
=\left[xy+\frac{y^{2}}{2}\right]_{0}^{1}
=x+\frac12.$$

**第三步：外层积分。**
$$\int_{0}^{1}\left(x+\frac12\right)dx
=\left[\frac{x^{2}}{2}+\frac{x}{2}\right]_{0}^{1}=1.$$

> 因为区域和被积函数都关于 $x,y$ 对称，也可以直接用对称性检验结果。`,
      answer: T`$1$`
    },
    {
      id: 'mul-2', chapter: 'multiple', level: 2, title: '极坐标下的二重积分',
      question: T`计算 $\displaystyle \iint_{x^{2}+y^{2}\le 1}e^{x^{2}+y^{2}}\,dA$。`,
      hint: T`被积函数和区域都含 $x^{2}+y^{2}$，用极坐标，别忘记雅可比因子 $r$。`,
      solution: T`**第一步：极坐标换元。**
$$x=r\cos\theta,\quad y=r\sin\theta,\quad dA=r\,dr\,d\theta,$$
区域变为 $0\le r\le1,\ 0\le\theta\le2\pi$。

**第二步：化为累次积分。**
$$\iint_{D}e^{x^{2}+y^{2}}dA
=\int_{0}^{2\pi}d\theta\int_{0}^{1}e^{r^{2}}r\,dr.$$

**第三步：计算。**
$$\int_{0}^{1}e^{r^{2}}r\,dr
=\frac12\left[e^{r^{2}}\right]_{0}^{1}
=\frac{e-1}{2}.$$
所以原式
$$=2\pi\cdot\frac{e-1}{2}=\pi(e-1).$$

> 最容易丢的就是 $r$。极坐标面积元素是 $r\,dr\,d\theta$，不是 $dr\,d\theta$。`,
      answer: T`$\pi(e-1)$`
    },
    {
      id: 'mul-3', chapter: 'multiple', level: 2, title: '交换积分次序',
      question: T`交换积分次序：$\displaystyle \int_{0}^{1}dx\int_{x}^{1}f(x,y)\,dy$。`,
      hint: T`先画出区域 $0\le x\le1,\ x\le y\le1$，再改成先对 $x$ 积分。`,
      solution: T`**第一步：识别区域。**
$$D=\{(x,y)\mid 0\le x\le1,\ x\le y\le1\},$$
即由 $y=x$、$y=1$、$x=0$ 围成的三角形。

**第二步：换一种描述。** 先看 $y$ 的范围：$0\le y\le1$；固定 $y$ 后，$x$ 从 $0$ 到 $y$：
$$D=\{(x,y)\mid 0\le y\le1,\ 0\le x\le y\}.$$

**第三步：写出新次序。**
$$\int_{0}^{1}dx\int_{x}^{1}f(x,y)\,dy
=\int_{0}^{1}dy\int_{0}^{y}f(x,y)\,dx.$$

> 交换次序的关键是画图，并用“先固定谁”的方式重新描述区域。`,
      answer: T`$\displaystyle \int_{0}^{1}dy\int_{0}^{y}f(x,y)\,dx$`
    },

    /* ---------- 曲线与曲面积分 ---------- */
    {
      id: 'ls-1', chapter: 'line-surface', level: 2, title: '格林公式',
      question: T`计算 $\displaystyle \oint_{L}x\,dy-y\,dx$，其中 $L$ 为圆 $x^{2}+y^{2}=a^{2}$，取逆时针方向。`,
      hint: T`这是第二类曲线积分，$P=-y,\ Q=x$，用格林公式化为二重积分。`,
      solution: T`**第一步：对应 $P,Q$。**
$$P=-y,\qquad Q=x.$$

**第二步：算格林公式的被积函数。**
$$\frac{\partial Q}{\partial x}-\frac{\partial P}{\partial y}=1-(-1)=2.$$

**第三步：化为面积。**
$$\oint_{L}x\,dy-y\,dx
=\iint_{D}2\,dxdy=2\cdot\pi a^{2}=2\pi a^{2}.$$

> 也可直接参数化：$x=a\cos\theta,\ y=a\sin\theta$，得到 $\int_{0}^{2\pi}a^{2}d\theta=2\pi a^{2}$。`,
      answer: T`$2\pi a^{2}$`
    },
    {
      id: 'ls-2', chapter: 'line-surface', level: 1, title: '第一类曲线积分',
      question: T`计算 $\displaystyle \oint_{L}(x^{2}+y^{2})\,ds$，其中 $L$ 为圆 $x^{2}+y^{2}=a^{2}$。`,
      hint: T`在曲线 $L$ 上，$x^{2}+y^{2}$ 恒等于 $a^{2}$，可以提到积分号外。`,
      solution: T`**第一步：利用曲线方程。** 因为 $L$ 上处处有 $x^{2}+y^{2}=a^{2}$，
$$\oint_{L}(x^{2}+y^{2})ds=a^{2}\oint_{L}ds.$$

**第二步：曲线长度。** 圆周长 $\oint_{L}ds=2\pi a$。

**第三步：相乘。**
$$\oint_{L}(x^{2}+y^{2})ds=a^{2}\cdot2\pi a=2\pi a^{3}.$$

> 第一类曲线积分与方向无关，$ds$ 是弧长元素。能在曲线上化简被积函数时，优先化简。`,
      answer: T`$2\pi a^{3}$`
    },
    {
      id: 'ls-3', chapter: 'line-surface', level: 3, title: '第一类曲面积分',
      question: T`计算 $\displaystyle \iint_{\Sigma}z\,dS$，其中 $\Sigma$ 为上半球面 $z=\sqrt{a^{2}-x^{2}-y^{2}}$。`,
      hint: T`投影到 $xOy$ 面：$dS=\frac{a}{z}dxdy$，被积函数中的 $z$ 会正好约掉。`,
      solution: T`**第一步：投影。** 曲面在 $xOy$ 面上的投影区域为圆盘 $D:x^{2}+y^{2}\le a^{2}$。

**第二步：面积元素。**
$$z=\sqrt{a^{2}-x^{2}-y^{2}},\qquad
dS=\sqrt{1+z_{x}^{2}+z_{y}^{2}}\,dxdy=\frac{a}{z}dxdy.$$

**第三步：化简积分。**
$$\iint_{\Sigma}z\,dS
=\iint_{D}z\cdot\frac{a}{z}\,dxdy
=a\iint_{D}dxdy=a\cdot\pi a^{2}=\pi a^{3}.$$

> 上半球面面积是 $2\pi a^{2}$，而这里被积函数 $z$ 关于球面平均为 $a/2$，结果 $\pi a^{3}$ 也符合直觉。`,
      answer: T`$\pi a^{3}$`
    },

    /* ---------- 无穷级数 ---------- */
    {
      id: 'ser-1', chapter: 'series', level: 1, title: 'p 级数',
      question: T`判断级数 $\displaystyle \sum_{n=1}^{\infty}\frac{1}{n^{2}}$ 的敛散性。`,
      hint: T`这是 $p$ 级数，看 $p$ 与 $1$ 的大小关系。`,
      solution: T`**第一步：识别类型。** 这是 $p$ 级数
$$\sum_{n=1}^{\infty}\frac{1}{n^{p}},\qquad p=2.$$

**第二步：用判别结论。** $p$ 级数当 $p>1$ 时收敛，当 $p\le1$ 时发散。

**第三步：结论。** 因为 $2>1$，所以级数收敛。其和为
$$\sum_{n=1}^{\infty}\frac{1}{n^{2}}=\frac{\pi^{2}}{6}.$$

> 不要把 $p$ 级数与几何级数混淆：$\sum q^{n}$ 看 $|q|<1$，$\sum n^{-p}$ 看 $p>1$。`,
      answer: T`收敛（和为 $\dfrac{\pi^{2}}{6}$）`
    },
    {
      id: 'ser-2', chapter: 'series', level: 2, title: '交错级数的条件收敛',
      question: T`讨论级数 $\displaystyle \sum_{n=1}^{\infty}\frac{(-1)^{n}}{n}$ 的敛散性。`,
      hint: T`先看绝对值级数是否收敛，再用莱布尼茨判别法看原级数。`,
      solution: T`**第一步：看绝对值级数。**
$$\sum_{n=1}^{\infty}\left|\frac{(-1)^{n}}{n}\right|
=\sum_{n=1}^{\infty}\frac1n,$$
这是调和级数，发散，所以原级数不绝对收敛。

**第二步：用莱布尼茨判别法。** 令 $a_{n}=\frac1n$，则
$$a_{n}\downarrow0\qquad(n\to\infty),$$
满足交错级数收敛的条件。

**第三步：结论。** 原级数收敛，但不绝对收敛，因此是**条件收敛**。

> 判断交错级数时，先绝对收敛，再条件收敛，顺序不要反。`,
      answer: T`条件收敛`
    },
    {
      id: 'ser-3', chapter: 'series', level: 2, title: '幂级数的收敛域',
      question: T`求幂级数 $\displaystyle \sum_{n=1}^{\infty}\frac{(x-1)^{n}}{2^{n}}$ 的收敛域。`,
      hint: T`这是以 $x=1$ 为中心的幂级数，先用比值法求收敛半径，再单独检查端点。`,
      solution: T`**第一步：求收敛半径。** 令 $u_n=\frac{(x-1)^n}{2^n}$，
$$\lim_{n\to\infty}\left|\frac{u_{n+1}}{u_{n}}\right|
=\frac{|x-1|}{2}.$$
要求 $\frac{|x-1|}{2}<1$，即 $|x-1|<2$，收敛半径 $R=2$。

**第二步：写出开区间。**
$$-1<x<3.$$

**第三步：检查端点。**
- $x=3$：级数为 $\sum 1$，通项不趋于 $0$，发散。
- $x=-1$：级数为 $\sum(-1)^{n}$，通项不趋于 $0$，发散。

**第四步：结论。** 收敛域为 $(-1,3)$。`,
      answer: T`$(-1,3)$`
    },

    /* ---------- 常微分方程 ---------- */
    {
      id: 'ode-1', chapter: 'ode', level: 1, title: '可分离变量方程',
      question: T`求初值问题 $\begin{cases}y'=2xy,\\ y(0)=1\end{cases}$ 的解。`,
      hint: T`把 $y'=\frac{dy}{dx}$ 写成 $\frac{dy}{y}=2x\,dx$，两边积分。`,
      solution: T`**第一步：分离变量。**
$$\frac{dy}{dx}=2xy
\ \Rightarrow\ \frac{dy}{y}=2x\,dx\qquad(y\ne0).$$

**第二步：两边积分。**
$$\ln|y|=x^{2}+C_1
\ \Rightarrow\ y=Ce^{x^{2}}.$$

**第三步：代入初值。** $y(0)=1$ 得 $C=1$，所以
$$y=e^{x^{2}}.$$

> 分离变量时除以 $y$ 会漏掉 $y=0$ 的解；本题初值非零，不影响结果。`,
      answer: T`$y=e^{x^{2}}$`
    },
    {
      id: 'ode-2', chapter: 'ode', level: 2, title: '一阶线性方程',
      question: T`求初值问题 $\begin{cases}y'+y=e^{x},\\ y(0)=0\end{cases}$ 的解。`,
      hint: T`这是一阶线性方程，积分因子为 $e^{\int 1\,dx}=e^{x}$。`,
      solution: T`**第一步：求积分因子。**
$$\mu(x)=e^{\int 1\,dx}=e^{x}.$$

**第二步：两边乘 $e^{x}$。**
$$e^{x}y'+e^{x}y=e^{2x}
\ \Rightarrow\ \left(ye^{x}\right)'=e^{2x}.$$

**第三步：积分。**
$$ye^{x}=\frac12e^{2x}+C
\ \Rightarrow\ y=\frac12e^{x}+Ce^{-x}.$$

**第四步：代初值。**
$$0=\frac12+C\ \Rightarrow\ C=-\frac12.$$
所以
$$y=\frac12\left(e^{x}-e^{-x}\right)=\sinh x.$$

> 一阶线性方程的通解公式：$y=e^{-\int Pdx}\left(\int Qe^{\int Pdx}dx+C\right)$。`,
      answer: T`$y=\sinh x=\dfrac{e^{x}-e^{-x}}{2}$`
    },
    {
      id: 'ode-3', chapter: 'ode', level: 2, title: '二阶常系数齐次方程',
      question: T`求 $y''-3y'+2y=0$ 的通解。`,
      hint: T`写特征方程 $r^{2}-3r+2=0$，求出两个特征根。`,
      solution: T`**第一步：写特征方程。**
$$r^{2}-3r+2=0.$$

**第二步：因式分解。**
$$(r-1)(r-2)=0\ \Rightarrow\ r_1=1,\ r_2=2.$$

**第三步：写通解。** 两个不同实根对应
$$y=C_1e^{x}+C_2e^{2x},$$
其中 $C_1,C_2$ 为任意常数。

> 三种情形要记牢：不同实根、重根、共轭复根。本题是不同实根。`,
      answer: T`$y=C_1e^{x}+C_2e^{2x}$`
    }
  ];

  window.CALC_DATA = { CHAPTERS, QUESTIONS };
})();
