import React, { useState, useEffect } from 'react';
import { Gift, Trash2, UserPlus, Snowflake, Sparkles, Eye, EyeOff, RotateCcw, User, Share2, Copy, Link as LinkIcon, Users } from 'lucide-react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, collection, addDoc, doc, onSnapshot, serverTimestamp } from 'firebase/firestore';

// --- Firebase 初始化逻辑 ---
// 注意：在实际部署时，Vercel 环境会自动注入这些变量。
// 如果你在本地开发，确保环境模拟了这些变量，或者代码能容错。
const initFirebase = () => {
  try {
    if (typeof __firebase_config !== 'undefined') {
      const firebaseConfig = JSON.parse(__firebase_config);
      const app = initializeApp(firebaseConfig);
      const auth = getAuth(app);
      const db = getFirestore(app);
      const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app';
      return { auth, db, appId, isConfigured: true };
    }
  } catch (e) {
    console.error("Firebase init error:", e);
  }
  return { isConfigured: false };
};

const { auth, db, appId, isConfigured } = initFirebase();

const SecretSantaApp = () => {
  // --- 基础状态 ---
  const [user, setUser] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [currentName, setCurrentName] = useState('');
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // --- 房间与路由状态 ---
  const [roomId, setRoomId] = useState(null);
  const [isOrganizer, setIsOrganizer] = useState(false);
  const [shareUrl, setShareUrl] = useState('');
  const [copySuccess, setCopySuccess] = useState(false);

  // --- 视图状态 ---
  // 'setup': 输入名单阶段 (只有无 roomId 时显示)
  // 'shuffling': 动画阶段
  // 'selection': 列表选择阶段
  // 'reveal': 揭晓结果阶段
  const [viewStep, setViewStep] = useState('setup');
  const [currentPair, setCurrentPair] = useState(null);

  // 1. 认证与初始化
  useEffect(() => {
    if (!isConfigured) {
      setLoading(false);
      setError("未检测到 Firebase 配置，请在支持云存储的环境运行。");
      return;
    }

    const initAuth = async () => {
      try {
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
          await signInWithCustomToken(auth, __initial_auth_token);
        } else {
          await signInAnonymously(auth);
        }
      } catch (err) {
        console.error("Auth failed", err);
        setError("登录服务失败，请刷新重试");
      }
    };

    initAuth();
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      if (u) checkUrlForRoom();
    });
    return () => unsubscribe();
  }, []);

  // 2. 检查 URL 是否带有房间号
  const checkUrlForRoom = () => {
    const params = new URLSearchParams(window.location.search);
    const roomParam = params.get('room');
    if (roomParam) {
      setRoomId(roomParam);
      // 如果有房间号，直接进入监听模式
      // 这里的 viewStep 会由数据监听来决定
    } else {
      setLoading(false);
      setViewStep('setup');
    }
  };

  // 3. 监听房间数据 (当有 user 和 roomId 时)
  useEffect(() => {
    if (!user || !roomId || !db) return;

    setLoading(true);
    // 路径规则：artifacts/{appId}/public/data/secret-santa-rooms/{roomId}
    const roomRef = doc(db, 'artifacts', appId, 'public', 'data', 'secret-santa-rooms', roomId);

    const unsubscribe = onSnapshot(roomRef, (snapshot) => {
      setLoading(false);
      if (snapshot.exists()) {
        const data = snapshot.data();
        setAssignments(data.assignments || []);
        // 如果拿到数据，且不在揭晓模式，就进入选择模式
        if (viewStep !== 'reveal') {
          setViewStep('selection');
        }
        
        // 生成分享链接
        const url = new URL(window.location.href);
        url.searchParams.set('room', roomId);
        setShareUrl(url.toString());
      } else {
        setError("找不到这个房间的数据，可能已被删除。");
        setRoomId(null);
        setViewStep('setup');
      }
    }, (err) => {
      console.error("Fetch error", err);
      setLoading(false);
      setError("读取房间数据失败。");
    });

    return () => unsubscribe();
  }, [user, roomId, viewStep]);

  // --- 业务逻辑：输入与管理 ---

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

  // --- 业务逻辑：生成配对并保存到云端 ---
  const generateAndSave = async () => {
    if (participants.length < 2) {
      setError('至少需要两名参与者才能开始！');
      return;
    }
    if (!user) return;

    setLoading(true);
    setViewStep('shuffling');

    // 模拟一点延迟体验动画
    await new Promise(r => setTimeout(r, 1500));

    // 1. 算法生成
    const shuffled = [...participants];
    // Fisher-Yates
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    const newAssignments = shuffled.map((giver, i) => ({
      giver,
      receiver: shuffled[(i + 1) % shuffled.length]
    }));
    newAssignments.sort((a, b) => a.giver.name.localeCompare(b.giver.name));

    // 2. 保存到 Firestore
    try {
      const collectionRef = collection(db, 'artifacts', appId, 'public', 'data', 'secret-santa-rooms');
      const docRef = await addDoc(collectionRef, {
        created_by: user.uid,
        created_at: serverTimestamp(),
        assignments: newAssignments,
        participant_count: participants.length
      });

      // 3. 更新状态
      setIsOrganizer(true);
      setRoomId(docRef.id); // 这会触发上面的 useEffect 监听，自动跳转到 selection
      
      // 更新浏览器 URL 方便刷新
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.set('room', docRef.id);
      window.history.pushState({}, '', newUrl);

    } catch (err) {
      console.error("Save error", err);
      setError("保存数据失败，请重试");
      setViewStep('setup');
      setLoading(false);
    }
  };

  // --- 业务逻辑：查看结果 ---
  const handleNameClick = (pair) => {
    setCurrentPair(pair);
    setViewStep('reveal');
  };

  const handleDone = () => {
    setViewStep('selection');
    setCurrentPair(null);
  };

  const copyLink = () => {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(shareUrl).then(() => {
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 2000);
      });
    } else {
        // Fallback
        const textArea = document.createElement("textarea");
        textArea.value = shareUrl;
        document.body.appendChild(textArea);
        textArea.select();
        try {
            document.execCommand('copy');
            setCopySuccess(true);
            setTimeout(() => setCopySuccess(false), 2000);
        } catch (err) {
            console.error('Fallback: Oops, unable to copy', err);
        }
        document.body.removeChild(textArea);
    }
  };

  const createNewGame = () => {
      window.location.href = window.location.pathname; // 清除参数重载
  };

  // --- 渲染部分 ---

  if (loading && viewStep !== 'shuffling') {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white">
        <Snowflake className="animate-spin mr-2" /> 连接圣诞网络中...
      </div>
    );
  }

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
          {roomId && <div className="text-red-200 text-xs mt-2 font-mono bg-red-800/30 inline-block px-2 py-1 rounded">房间号: {roomId.slice(0,6)}...</div>}
        </div>

        {/* 主要内容 */}
        <div className="p-6 flex-1 flex flex-col relative">
          
          {/* 错误提示 */}
          {error && (
            <div className="absolute top-4 left-4 right-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded z-50 text-sm flex justify-between items-center">
                <span>{error}</span>
                <button onClick={() => setError('')}><Users size={14}/></button>
            </div>
          )}

          {/* 阶段 1: 组织者设置 (Setup) */}
          {viewStep === 'setup' && (
            <div className="space-y-6 animate-fadeIn">
              <div className="text-center text-gray-500 text-sm mb-2">
                👋 你是组织者。输入所有人的名字，生成后发送链接给他们。
              </div>

              <form onSubmit={addParticipant} className="relative">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={currentName}
                    onChange={(e) => setCurrentName(e.target.value)}
                    placeholder="输入参与者名字..."
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
                    添加名字开始创建...
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
                onClick={generateAndSave}
                disabled={participants.length < 2}
                className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-4 rounded-xl shadow-xl shadow-red-600/30 transition-all transform hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:scale-100 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <Sparkles size={20} />
                生成并创建房间
              </button>
            </div>
          )}

          {/* 阶段 2: 动画 (Shuffling) */}
          {viewStep === 'shuffling' && (
            <div className="flex flex-col items-center justify-center flex-1 space-y-6">
              <div className="relative">
                <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center animate-ping absolute opacity-20"></div>
                <Gift size={64} className="text-red-600 animate-bounce relative z-10" />
              </div>
              <div className="text-center">
                <h3 className="text-xl font-bold text-gray-800 mb-2">正在云端匹配...</h3>
                <p className="text-gray-500 text-sm">正在创建秘密房间</p>
              </div>
            </div>
          )}

          {/* 阶段 3: 选择/查看 (Selection) - 所有人可见 */}
          {viewStep === 'selection' && (
            <div className="flex flex-col h-full animate-fadeIn">
              
              {/* 顶部提示：如果是刚创建的人，显示分享链接 */}
              {isOrganizer && (
                 <div className="bg-green-50 border border-green-100 rounded-lg p-3 mb-3 flex flex-col gap-2">
                    <div className="flex items-center gap-2 text-green-800 text-sm font-bold">
                        <Share2 size={16}/> 邀请朋友加入
                    </div>
                    <div className="flex gap-2">
                        <input readOnly value={shareUrl} className="flex-1 text-xs bg-white border border-green-200 rounded px-2 py-1 text-gray-500 truncate" />
                        <button 
                            onClick={copyLink}
                            className={`px-3 py-1 rounded text-xs font-bold transition-colors flex items-center gap-1 ${copySuccess ? 'bg-green-600 text-white' : 'bg-green-100 text-green-700 hover:bg-green-200'}`}
                        >
                            {copySuccess ? <><Users size={12}/> 已复制</> : <><Copy size={12}/> 复制</>}
                        </button>
                    </div>
                 </div>
              )}

              {!isOrganizer && (
                  <div className="bg-yellow-50 border border-yellow-100 rounded-lg p-4 mb-4 text-sm text-yellow-800 flex gap-3 items-start">
                    <div className="mt-0.5"><User size={16}/></div>
                    <div>
                        <strong>房间已就绪！</strong><br/>
                        找到你自己的名字，查看你的送礼对象。
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

              <button onClick={createNewGame} className="mt-2 text-xs text-gray-400 hover:text-gray-600 flex items-center justify-center gap-1 py-2">
                <RotateCcw size={12} /> 创建一个新的抽签
              </button>
            </div>
          )}

          {/* 阶段 4: 揭晓结果 (Reveal) */}
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
