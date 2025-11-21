import React, { useState, useEffect } from 'react';
import { Gift, Trash2, UserPlus, Snowflake, Sparkles, Eye, EyeOff, RotateCcw, User, Share2, Copy, Mail, Send, CheckCircle, AlertCircle } from 'lucide-react';

// --- 工具函数：URL 数据压缩与解压 (支持中文) ---
const encodeData = (data) => {
  try {
    const jsonStr = JSON.stringify(data);
    const uriEncoded = encodeURIComponent(jsonStr).replace(/%([0-9A-F]{2})/g,
        function toSolidBytes(match, p1) {
            return String.fromCharCode('0x' + p1);
    });
    return btoa(uriEncoded);
  } catch (e) {
    console.error("Encoding failed", e);
    return "";
  }
};

const decodeData = (base64) => {
  try {
    const str = atob(base64);
    const uriEncoded = str.split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join('');
    return JSON.parse(decodeURIComponent(uriEncoded));
  } catch (e) {
    console.error("Decoding failed", e);
    return null;
  }
};

const SecretSantaApp = () => {
  const [participants, setParticipants] = useState([]);
  const [currentName, setCurrentName] = useState('');
  const [assignments, setAssignments] = useState([]);
  const [error, setError] = useState('');
  const [copySuccess, setCopySuccess] = useState(false);

  // 视图状态: 'setup'(设置), 'shuffling'(动画), 'selection'(选择名字), 'email-login'(邮箱登录)
  const [viewStep, setViewStep] = useState('setup');
  const [currentPair, setCurrentPair] = useState(null);
  const [isOrganizer, setIsOrganizer] = useState(false);
  
  // 邮箱相关状态
  const [email, setEmail] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [showDirectReveal, setShowDirectReveal] = useState(false); // 备用：直接查看

  // 初始化
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const dataParam = params.get('d');
    if (dataParam) {
      const decoded = decodeData(dataParam);
      if (decoded && Array.isArray(decoded)) {
        setAssignments(decoded);
        setViewStep('selection');
      } else {
        setError("链接已损坏，请重新生成。");
      }
    }
  }, []);

  // --- 核心逻辑 ---

  const addParticipant = (e) => {
    e.preventDefault();
    if (!currentName.trim()) return;
    if (participants.some(p => p.name === currentName.trim())) {
      setError('名字已存在！');
      return;
    }
    setParticipants([...participants, { id: Date.now(), name: currentName.trim() }]);
    setCurrentName('');
    setError('');
  };

  const removeParticipant = (id) => {
    setParticipants(participants.filter(p => p.id !== id));
  };

  const generateAndShare = async () => {
    if (participants.length < 2) {
      setError('至少需要两人！');
      return;
    }
    setViewStep('shuffling');
    await new Promise(r => setTimeout(r, 1500));

    const shuffled = [...participants];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    const newAssignments = shuffled.map((giver, i) => ({
      giver,
      receiver: shuffled[(i + 1) % shuffled.length]
    }));
    newAssignments.sort((a, b) => a.giver.name.localeCompare(b.giver.name));

    setAssignments(newAssignments);
    const encoded = encodeData(newAssignments);
    const newUrl = new URL(window.location.href);
    newUrl.searchParams.set('d', encoded);
    window.history.pushState({}, '', newUrl);
    
    setIsOrganizer(true);
    setViewStep('selection');
  };

  // 进入邮箱登录页
  const handleNameClick = (pair) => {
    setCurrentPair(pair);
    setEmail('');
    setEmailSent(false);
    setShowDirectReveal(false);
    setViewStep('email-login');
  };

  // 模拟发送邮件
  const handleSendEmail = async (e) => {
    e.preventDefault();
    if (!email.trim() || !email.includes('@')) {
      setError("请输入有效的邮箱地址");
      return;
    }
    
    setIsSending(true);
    setError('');

    // --- 真实场景集成 EmailJS 说明 ---
    // 在这里你可以集成 emailjs-com
    // emailjs.send('YOUR_SERVICE_ID', 'YOUR_TEMPLATE_ID', {
    //   to_email: email,
    //   to_name: currentPair.giver.name,
    //   target_name: currentPair.receiver.name
    // }, 'YOUR_PUBLIC_KEY')
    
    // 这里是模拟发送
    setTimeout(() => {
      console.log(`%c[模拟邮件服务]`, "color: green; font-weight: bold; font-size: 14px;");
      console.log(`收件人: ${email}`);
      console.log(`内容: 嗨 ${currentPair.giver.name}，你的神秘送礼对象是: 【${currentPair.receiver.name}】`);
      
      setIsSending(false);
      setEmailSent(true);
    }, 1500);
  };

  const copyLink = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url).then(() => {
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 2000);
    }).catch(() => alert("复制失败，请手动复制浏览器地址"));
  };

  const resetGame = () => {
    const url = new URL(window.location.href);
    url.searchParams.delete('d');
    window.history.pushState({}, '', url);
    setAssignments([]);
    setParticipants([]);
    setIsOrganizer(false);
    setViewStep('setup');
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 font-sans relative overflow-hidden">
      {/* 背景特效 */}
      <div className="absolute inset-0 pointer-events-none opacity-20">
        <div className="absolute top-10 left-10 text-red-500 animate-bounce duration-1000"><Snowflake size={32} /></div>
        <div className="absolute top-40 right-20 text-green-500 animate-pulse"><Snowflake size={24} /></div>
        <div className="absolute bottom-20 left-1/3 text-white animate-spin-slow"><Snowflake size={48} /></div>
      </div>

      <div className="w-full max-w-md bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl overflow-hidden border-t-4 border-red-600 z-10 flex flex-col" style={{ minHeight: '550px' }}>
        
        <div className="bg-gradient-to-r from-red-600 to-red-700 p-6 text-center relative shrink-0">
          <div className="absolute top-2 right-2">
            <Snowflake className="text-white/30 animate-spin" size={40} />
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-white flex items-center justify-center gap-2">
            <Gift className="text-yellow-300" />
            神秘圣诞老人
          </h1>
        </div>

        <div className="p-6 flex-1 flex flex-col relative">
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4 text-sm flex items-center gap-2">
                <AlertCircle size={16}/> {error}
            </div>
          )}

          {/* 1. 设置阶段 */}
          {viewStep === 'setup' && (
            <div className="space-y-6 animate-fadeIn">
              <div className="text-center text-gray-500 text-sm mb-2">
                👋 输入参与者名单，生成链接发给他们。
              </div>
              <form onSubmit={addParticipant} className="flex gap-2">
                  <input
                    type="text"
                    value={currentName}
                    onChange={(e) => setCurrentName(e.target.value)}
                    placeholder="输入名字..."
                    className="flex-1 px-4 py-3 rounded-xl border border-gray-200 focus:border-red-500 focus:ring-2 outline-none text-gray-700"
                  />
                  <button type="submit" disabled={!currentName.trim()} className="bg-green-600 hover:bg-green-700 text-white p-3 rounded-xl disabled:opacity-50">
                    <UserPlus size={24} />
                  </button>
              </form>
              <div className="bg-slate-50 rounded-xl p-4 min-h-[200px] max-h-[300px] overflow-y-auto custom-scrollbar">
                {participants.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-32 text-gray-400 text-sm">
                    <Gift size={32} className="mb-2 opacity-30" /> 添加名字开始...
                  </div>
                ) : (
                  <div className="space-y-2">
                    {participants.map((p) => (
                      <div key={p.id} className="flex justify-between bg-white p-3 rounded-lg border border-gray-100 shadow-sm">
                        <span className="font-medium text-gray-700">{p.name}</span>
                        <button onClick={() => removeParticipant(p.id)} className="text-gray-300 hover:text-red-500"><Trash2 size={18} /></button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <button onClick={generateAndShare} disabled={participants.length < 2} className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-4 rounded-xl shadow-xl transition-all disabled:opacity-50 flex justify-center gap-2">
                <Sparkles size={20} /> 生成并获取链接
              </button>
            </div>
          )}

          {/* 2. 动画过渡 */}
          {viewStep === 'shuffling' && (
            <div className="flex flex-col items-center justify-center flex-1 space-y-6">
              <Gift size={64} className="text-red-600 animate-bounce" />
              <div className="text-center text-gray-500">正在准备礼物清单...</div>
            </div>
          )}

          {/* 3. 列表选择 */}
          {viewStep === 'selection' && (
            <div className="flex flex-col h-full animate-fadeIn">
              {isOrganizer ? (
                 <div className="bg-green-50 border border-green-100 rounded-lg p-4 mb-4 flex flex-col gap-3">
                    <div className="flex items-center gap-2 text-green-800 font-bold"><Share2 size={18}/> 分享给朋友</div>
                    <div className="text-xs text-green-700">复制下方链接发到群里，每个人点击自己的名字即可接收结果。</div>
                    <button onClick={copyLink} className={`w-full py-3 rounded-lg font-bold flex justify-center gap-2 ${copySuccess ? 'bg-green-600 text-white' : 'bg-white text-green-700 border border-green-200'}`}>
                        {copySuccess ? "✅ 链接已复制" : <><Copy size={16}/> 复制链接</>}
                    </button>
                 </div>
              ) : (
                  <div className="bg-yellow-50 border border-yellow-100 rounded-lg p-4 mb-4 text-sm text-yellow-800 flex gap-2">
                    <User size={16} className="shrink-0 mt-0.5"/>
                    <strong>请点击你自己的名字进行登录。</strong>
                </div>
              )}
              <div className="grid grid-cols-2 gap-3 overflow-y-auto custom-scrollbar flex-1 content-start pb-4">
                {assignments.map((pair) => (
                  <button key={pair.giver.id} onClick={() => handleNameClick(pair)} className="flex flex-col items-center justify-center p-4 bg-white border-2 border-gray-100 rounded-xl hover:border-red-500 hover:bg-red-50 transition-all">
                    <div className="w-10 h-10 rounded-full bg-gray-100 text-gray-500 flex items-center justify-center font-bold mb-2">
                      {pair.giver.name.charAt(0).toUpperCase()}
                    </div>
                    <span className="font-bold text-gray-700 truncate w-full text-center text-sm">{pair.giver.name}</span>
                  </button>
                ))}
              </div>
              <button onClick={resetGame} className="mt-2 text-xs text-gray-400 hover:text-red-400 flex justify-center gap-1 py-2"><RotateCcw size={12} /> 重置游戏</button>
            </div>
          )}

          {/* 4. 邮箱登录与发送 */}
          {viewStep === 'email-login' && currentPair && (
            <div className="flex flex-col flex-1 animate-fadeIn">
              <button onClick={() => setViewStep('selection')} className="self-start text-gray-400 hover:text-gray-600 text-sm mb-4">← 返回列表</button>
              
              {!emailSent ? (
                <div className="flex flex-col items-center text-center space-y-6 mt-4">
                   <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center text-red-600">
                      <User size={40} />
                   </div>
                   <div>
                     <h2 className="text-2xl font-bold text-gray-800">你好，{currentPair.giver.name}</h2>
                     <p className="text-gray-500 text-sm mt-2">为确保隐私，结果将发送至你的邮箱。</p>
                   </div>

                   <form onSubmit={handleSendEmail} className="w-full max-w-xs space-y-4">
                      <div className="relative">
                        <Mail className="absolute left-3 top-3.5 text-gray-400" size={18} />
                        <input 
                          type="email" 
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="输入你的邮箱地址"
                          className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none"
                        />
                      </div>
                      <button 
                        type="submit" 
                        disabled={isSending || !email}
                        className="w-full bg-gray-900 hover:bg-black text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 disabled:opacity-50"
                      >
                        {isSending ? "发送中..." : <><Send size={18} /> 发送结果</>}
                      </button>
                   </form>

                   {/* 备用方案：直接查看 */}
                   <div className="mt-8 pt-8 border-t border-gray-100 w-full">
                     <p className="text-xs text-gray-400 mb-2">无法接收邮件？</p>
                     {!showDirectReveal ? (
                       <button onClick={() => setShowDirectReveal(true)} className="text-xs text-red-400 hover:text-red-600 underline">
                         在屏幕上直接查看 (不推荐)
                       </button>
                     ) : (
                       <div className="bg-slate-100 p-4 rounded-lg animate-fadeIn">
                          <p className="text-xs text-gray-500 mb-1">你的送礼对象是：</p>
                          <strong className="text-lg text-red-600">{currentPair.receiver.name}</strong>
                       </div>
                     )}
                   </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center flex-1 text-center space-y-6">
                   <CheckCircle size={64} className="text-green-500 animate-bounce" />
                   <div>
                     <h2 className="text-2xl font-bold text-gray-800">邮件已发送！</h2>
                     <p className="text-gray-600 mt-2">请检查你的收件箱 <strong>{email}</strong></p>
                     <p className="text-xs text-gray-400 mt-4">(演示模式下请按 F12 查看控制台日志)</p>
                   </div>
                   <button onClick={() => setViewStep('selection')} className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-3 px-8 rounded-xl transition-colors">
                     完成
                   </button>
                </div>
              )}
            </div>
          )}

        </div>
        
        <div className="bg-gray-50 p-3 text-center text-xs text-gray-400 border-t border-gray-100 shrink-0">
          Merry Christmas & Happy New Year
        </div>
      </div>
      
      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background-color: rgba(209, 213, 219, 0.5); border-radius: 20px; }
        .animate-fadeIn { animation: fadeIn 0.5s ease-out forwards; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .animate-spin-slow { animation: spin 8s linear infinite; }
      `}</style>
    </div>
  );
};

export default SecretSantaApp;
