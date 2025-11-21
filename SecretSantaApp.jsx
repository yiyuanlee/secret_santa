import React, { useState, useEffect } from 'react';
import { Gift, Trash2, UserPlus, Snowflake, Sparkles, Eye, EyeOff, RotateCcw, User, Share2, Copy, Link as LinkIcon, Users, Lock } from 'lucide-react';

// --- 工具函数：URL 数据压缩与解压 (支持中文) ---
const encodeData = (data) => {
  try {
    const jsonStr = JSON.stringify(data);
    // 简单的混淆，防止直接看 URL 猜出结果
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

  // 'setup': 输入名单阶段
  // 'shuffling': 动画阶段
  // 'selection': 列表选择阶段
  // 'reveal': 揭晓结果阶段
  const [viewStep, setViewStep] = useState('setup');
  const [currentPair, setCurrentPair] = useState(null);
  const [isOrganizer, setIsOrganizer] = useState(false); // 本地操作的人是否是生成者

  // 初始化：检查 URL 是否包含数据
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const dataParam = params.get('d'); // d for data
    
    if (dataParam) {
      const decoded = decodeData(dataParam);
      if (decoded && Array.isArray(decoded) && decoded.length > 0) {
        setAssignments(decoded);
        setViewStep('selection');
      } else {
        setError("链接似乎已损坏，请联系发给你链接的人重新生成。");
      }
    }
  }, []);

  // --- 业务逻辑 ---

  const addParticipant = (e) => {
    e.preventDefault();
    if (!currentName.trim()) return;
    if (participants.some(p => p.name === currentName.trim())) {
      setError('这个名字已经存在了！');
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
      setError('至少需要两名参与者才能开始！');
      return;
    }

    setViewStep('shuffling');
    setError('');

    // 模拟动画
    await new Promise(r => setTimeout(r, 1500));

    // 算法生成
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
    
    // 生成加密链接
    const encoded = encodeData(newAssignments);
    const newUrl = new URL(window.location.href);
    newUrl.searchParams.set('d', encoded); // Set data param
    
    // 更新浏览器地址栏，但不刷新页面
    window.history.pushState({}, '', newUrl);
    
    setIsOrganizer(true);
    setViewStep('selection');
  };

  const handleNameClick = (pair) => {
    setCurrentPair(pair);
    setViewStep('reveal');
  };

  const handleDone = () => {
    setViewStep('selection');
    setCurrentPair(null);
  };

  const copyLink = () => {
    const url = window.location.href;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(url).then(() => {
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 2000);
      });
    } else {
        // 备用复制方案
        const textArea = document.createElement("textarea");
        textArea.value = url;
        document.body.appendChild(textArea);
        textArea.select();
        try {
            document.execCommand('copy');
            setCopySuccess(true);
            setTimeout(() => setCopySuccess(false), 2000);
        } catch (err) {
            console.error('Fallback copy failed', err);
        }
        document.body.removeChild(textArea);
    }
  };

  const resetGame = () => {
    // 清除 URL 参数并重置
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
      {/* 背景装饰 */}
      <div className="absolute inset-0 pointer-events-none opacity-20">
        <div className="absolute top-10 left-10 text-red-500 animate-bounce duration-1000"><Snowflake size={32} /></div>
        <div className="absolute top-40 right-20 text-green-500 animate-pulse"><Snowflake size={24} /></div>
        <div className="absolute bottom-20 left-1/3 text-white animate-spin-slow"><Snowflake size={48} /></div>
      </div>

      <div className="w-full max-w-md bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl overflow-hidden border-t-4 border-red-600 z-10 flex flex-col" style={{ minHeight: '550px' }}>
        
        {/* 头部 */}
        <div className="bg-gradient-to-r from-red-600 to-red-700 p-6 text-center relative shrink-0">
          <div className="absolute top-2 right-2">
            <Snowflake className="text-white/30 animate-spin" size={40} />
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-white flex items-center justify-center gap-2">
            <Gift className="text-yellow-300" />
            神秘圣诞老人
          </h1>
        </div>

        {/* 主要内容 */}
        <div className="p-6 flex-1 flex flex-col relative">
          
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4 text-sm flex justify-between items-center">
                <span>{error}</span>
                <button onClick={() => setError('')}><Users size={14}/></button>
            </div>
          )}

          {/* 1. 输入阶段 (Setup) */}
          {viewStep === 'setup' && (
            <div className="space-y-6 animate-fadeIn">
              <div className="text-center text-gray-500 text-sm mb-2">
                👋 请输入所有参与者的名字，然后生成一个链接发给他们。
              </div>

              <form onSubmit={addParticipant} className="relative">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={currentName}
                    onChange={(e) => setCurrentName(e.target.value)}
                    placeholder="输入名字..."
                    className="flex-1 px-4 py-3 rounded-xl border border-gray-200 focus:border-red-500 focus:ring-2 focus:ring-red-200 outline-none transition-all text-gray-700"
                  />
                  <button 
                    type="submit"
                    disabled={!currentName.trim()}
                    className="bg-green-600 hover:bg-green-700 text-white p-3 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-green-600/30"
                  >
                    <UserPlus size={24} />
                  </button>
                </div>
              </form>

              <div className="bg-slate-50 rounded-xl p-4 min-h-[200px] max-h-[300px] overflow-y-auto custom-scrollbar">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-sm font-medium text-gray-500">名单 ({participants.length})</span>
                  {participants.length > 0 && (
                     <button onClick={() => setParticipants([])} className="text-xs text-red-400 hover:text-red-600">清空</button>
                  )}
                </div>
                
                {participants.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-32 text-gray-400 text-sm">
                    <Gift size={32} className="mb-2 opacity-30" />
                    添加名字开始...
                  </div>
                ) : (
                  <div className="space-y-2">
                    {participants.map((p) => (
                      <div key={p.id} className="flex items-center justify-between bg-white p-3 rounded-lg border border-gray-100 shadow-sm animate-fadeIn">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-red-100 text-red-600 flex items-center justify-center font-bold text-sm">
                            {p.name.charAt(0).toUpperCase()}
                          </div>
                          <span className="font-medium text-gray-700">{p.name}</span>
                        </div>
                        <button onClick={() => removeParticipant(p.id)} className="text-gray-300 hover:text-red-500 p-1">
                          <Trash2 size={18} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <button
                onClick={generateAndShare}
                disabled={participants.length < 2}
                className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-4 rounded-xl shadow-xl shadow-red-600/30 transition-all transform hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:scale-100 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <Sparkles size={20} />
                生成并获取链接
              </button>
            </div>
          )}

          {/* 2. 动画阶段 */}
          {viewStep === 'shuffling' && (
            <div className="flex flex-col items-center justify-center flex-1 space-y-6">
              <div className="relative">
                <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center animate-ping absolute opacity-20"></div>
                <Gift size={64} className="text-red-600 animate-bounce relative z-10" />
              </div>
              <div className="text-center">
                <h3 className="text-xl font-bold text-gray-800 mb-2">正在打包数据...</h3>
                <p className="text-gray-500 text-sm">正在生成秘密链接</p>
              </div>
            </div>
          )}

          {/* 3. 选择列表 (Selection) */}
          {viewStep === 'selection' && (
            <div className="flex flex-col h-full animate-fadeIn">
              
              {/* 如果是生成者，显示大大的分享按钮 */}
              {isOrganizer ? (
                 <div className="bg-green-50 border border-green-100 rounded-lg p-4 mb-4 flex flex-col gap-3 shadow-sm">
                    <div className="flex items-center gap-2 text-green-800 font-bold">
                        <Share2 size={18}/> 第一步：分享给朋友
                    </div>
                    <div className="text-xs text-green-700">
                        所有结果都已保存在这个链接里。发给朋友们，他们打开就能看到自己的任务。
                    </div>
                    <button 
                        onClick={copyLink}
                        className={`w-full py-3 rounded-lg font-bold transition-all flex items-center justify-center gap-2 shadow-sm ${copySuccess ? 'bg-green-600 text-white scale-95' : 'bg-white text-green-700 border border-green-200 hover:bg-green-100'}`}
                    >
                        {copySuccess ? <><Users size={16}/> 链接已复制！去微信粘贴吧</> : <><Copy size={16}/> 点击复制链接</>}
                    </button>
                 </div>
              ) : (
                  // 普通用户看到的提示
                  <div className="bg-yellow-50 border border-yellow-100 rounded-lg p-4 mb-4 text-sm text-yellow-800 flex gap-3 items-start">
                    <div className="mt-0.5"><User size={16}/></div>
                    <div>
                        <strong>找到你自己的名字</strong><br/>
                        点击名字，查看你的送礼对象。
                    </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3 overflow-y-auto custom-scrollbar flex-1 content-start pb-4">
                {assignments.map((pair) => (
                  <button 
                  key={pair.giver.id || pair.giver.name} 
                  onClick={() => handleNameClick(pair)}
                  className="flex flex-col items-center justify-center p-4 bg-white border-2 border-gray-100 rounded-xl hover:border-red-500 hover:bg-red-50 hover:shadow-md transition-all group min-h-[100px]"
                  >
                    <div className="w-10 h-10 rounded-full bg-gray-100 group-hover:bg-red-100 text-gray-500 group-hover:text-red-600 flex items-center justify-center font-bold text-lg mb-2 transition-colors">
                      {pair.giver.name.charAt(0).toUpperCase()}
                    </div>
                    <span className="font-bold text-gray-700 group-hover:text-red-700 truncate w-full text-center text-sm">
                      {pair.giver.name}
                    </span>
                  </button>
                ))}
              </div>

              <button onClick={resetGame} className="mt-2 text-xs text-gray-400 hover:text-red-400 flex items-center justify-center gap-1 py-2 transition-colors">
                <RotateCcw size={12} /> 结束并开始新一轮
              </button>
            </div>
          )}

          {/* 4. 揭晓结果 (Reveal) */}
          {viewStep === 'reveal' && currentPair && (
            <div className="flex flex-col items-center justify-center flex-1 text-center space-y-8 animate-fadeIn">
              <div className="space-y-2">
                  <p className="text-gray-500 uppercase tracking-wider text-xs font-bold">你好，{currentPair.giver.name}</p>
                  <p className="text-gray-500 uppercase tracking-wider text-xs font-bold">你的送礼对象是</p>
                  <div className="text-4xl font-extrabold text-gray-800 flex flex-col items-center gap-4 py-6">
                    <div className="relative">
                        <div className="absolute inset-0 bg-yellow-300 blur-xl opacity-30 animate-pulse"></div>
                        <Gift size={80} className="text-red-600 relative z-10" />
                    </div>
                    <span className="bg-clip-text text-transparent bg-gradient-to-r from-red-600 to-red-800">
                      {currentPair.receiver.name}
                    </span>
                  </div>
              </div>

              <div className="bg-slate-50 p-6 rounded-xl w-full text-sm text-gray-600 border border-gray-100">
                  <p>🎁 记得准备一份惊喜礼物哦！</p>
              </div>

              <button 
                onClick={handleDone}
                className="w-full bg-gray-800 hover:bg-gray-900 text-white font-bold py-4 rounded-xl shadow-xl flex items-center justify-center gap-2 mt-auto"
              >
                <EyeOff size={20} /> 隐藏并返回列表
              </button>
            </div>
          )}

        </div>
        
        {/* 底部版权 */}
        <div className="bg-gray-50 p-3 text-center text-xs text-gray-400 border-t border-gray-100 shrink-0">
          Merry Christmas & Happy New Year
        </div>
      </div>

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background-color: rgba(209, 213, 219, 0.5);
          border-radius: 20px;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.5s ease-out forwards;
        }
        .animate-spin-slow {
          animation: spin 8s linear infinite;
        }
      `}</style>
    </div>
  );
};

export default SecretSantaApp;
