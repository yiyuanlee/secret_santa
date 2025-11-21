import React, { useState } from 'react';
import { Gift, Trash2, UserPlus, Snowflake, Sparkles, Eye, EyeOff, RotateCcw, User } from 'lucide-react';

const SecretSantaApp = () => {
  const [participants, setParticipants] = useState([]);
  const [currentName, setCurrentName] = useState('');
  const [assignments, setAssignments] = useState([]);
  const [stage, setStage] = useState('input'); // 'input', 'shuffling', 'result'
  const [error, setError] = useState('');

  // 简化后的状态：只保留 'selection' (选名字) 和 'reveal' (看结果)
  const [viewStep, setViewStep] = useState('selection');
  const [currentPair, setCurrentPair] = useState(null); 

  // 添加参与者
  const addParticipant = (e) => {
    e.preventDefault();
    if (!currentName.trim()) return;
    
    if (participants.some(p => p.name === currentName.trim())) {
      setError('这个名字已经存在了！');
      return;
    }

    const newParticipant = {
      id: Date.now(),
      name: currentName.trim()
    };

    setParticipants([...participants, newParticipant]);
    setCurrentName('');
    setError('');
  };

  // 删除参与者
  const removeParticipant = (id) => {
    setParticipants(participants.filter(p => p.id !== id));
  };

  // 核心算法：生成配对
  const generatePairs = () => {
    if (participants.length < 2) {
      setError('至少需要两名参与者才能开始！');
      return;
    }

    setStage('shuffling');
    setError('');

    setTimeout(() => {
      const shuffled = [...participants];
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }

      const newAssignments = [];
      for (let i = 0; i < shuffled.length; i++) {
        const giver = shuffled[i];
        const receiver = shuffled[(i + 1) % shuffled.length];
        
        newAssignments.push({
          giver: giver,
          receiver: receiver
        });
      }

      newAssignments.sort((a, b) => a.giver.name.localeCompare(b.giver.name));
      
      setAssignments(newAssignments);
      setStage('result');
      setViewStep('selection');
    }, 1500);
  };

  const resetGame = () => {
    setAssignments([]);
    setStage('input');
    setViewStep('selection');
    setCurrentPair(null);
    setError('');
  };

  // 点击名字直接查看结果（去掉了中间的确认步骤）
  const handleNameClick = (pair) => {
    setCurrentPair(pair);
    setViewStep('reveal');
  };

  // 关闭结果，回到列表
  const handleDone = () => {
    setViewStep('selection');
    setCurrentPair(null);
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 font-sans relative overflow-hidden">
      {/* 背景装饰 */}
      <div className="absolute inset-0 pointer-events-none opacity-20">
        <div className="absolute top-10 left-10 text-red-500 animate-bounce duration-1000"><Snowflake size={32} /></div>
        <div className="absolute top-40 right-20 text-green-500 animate-pulse"><Snowflake size={24} /></div>
        <div className="absolute bottom-20 left-1/3 text-white animate-spin-slow"><Snowflake size={48} /></div>
        <div className="absolute top-1/2 right-10 text-red-400"><Sparkles size={36} /></div>
      </div>

      <div className="w-full max-w-md bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl overflow-hidden border-t-4 border-red-600 z-10 flex flex-col" style={{ minHeight: '500px' }}>
        
        {/* 头部 */}
        <div className="bg-gradient-to-r from-red-600 to-red-700 p-6 text-center relative shrink-0">
          <div className="absolute top-2 right-2">
            <Snowflake className="text-white/30 animate-spin" size={40} />
          </div>
          <h1 className="text-3xl font-bold text-white flex items-center justify-center gap-2">
            <Gift className="text-yellow-300" />
            神秘圣诞老人
          </h1>
          {stage === 'input' && <p className="text-red-100 text-sm mt-2">最公平、最有趣的礼物交换助手</p>}
        </div>

        {/* 主要内容区域 */}
        <div className="p-6 flex-1 flex flex-col">
          
          {stage === 'input' && (
            <div className="space-y-6 animate-fadeIn">
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
                {error && <p className="text-red-500 text-xs mt-2 absolute -bottom-5 left-1">{error}</p>}
              </form>

              <div className="bg-slate-50 rounded-xl p-4 min-h-[200px] max-h-[300px] overflow-y-auto custom-scrollbar">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-sm font-medium text-gray-500">参与名单 ({participants.length})</span>
                  {participants.length > 0 && (
                     <button onClick={() => setParticipants([])} className="text-xs text-red-400 hover:text-red-600">清空</button>
                  )}
                </div>
                
                {participants.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-32 text-gray-400 text-sm">
                    <Gift size={32} className="mb-2 opacity-30" />
                    还没有人加入哦，快来添加吧！
                  </div>
                ) : (
                  <div className="space-y-2">
                    {participants.map((p) => (
                      <div key={p.id} className="flex items-center justify-between bg-white p-3 rounded-lg border border-gray-100 shadow-sm hover:shadow-md transition-shadow group animate-fadeIn">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-red-100 text-red-600 flex items-center justify-center font-bold text-sm">
                            {p.name.charAt(0).toUpperCase()}
                          </div>
                          <span className="font-medium text-gray-700">{p.name}</span>
                        </div>
                        <button 
                          onClick={() => removeParticipant(p.id)}
                          className="text-gray-300 hover:text-red-500 transition-colors p-1"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <button
                onClick={generatePairs}
                disabled={participants.length < 2}
                className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-4 rounded-xl shadow-xl shadow-red-600/30 transition-all transform hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:scale-100 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <Sparkles size={20} />
                开始抽签！
              </button>
            </div>
          )}

          {stage === 'shuffling' && (
            <div className="flex flex-col items-center justify-center flex-1 space-y-6">
              <div className="relative">
                <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center animate-ping absolute opacity-20"></div>
                <Gift size={64} className="text-red-600 animate-bounce relative z-10" />
              </div>
              <div className="text-center">
                <h3 className="text-xl font-bold text-gray-800 mb-2">正在匹配中...</h3>
                <p className="text-gray-500 text-sm">圣诞老人正在查阅名单</p>
              </div>
            </div>
          )}

          {stage === 'result' && (
            <div className="flex flex-col flex-1 animate-fadeIn">
               
               {/* 列表模式 */}
               {viewStep === 'selection' && (
                 <>
                   <div className="bg-yellow-50 border border-yellow-100 rounded-lg p-4 mb-4 text-sm text-yellow-800 flex gap-3 items-start">
                      <div className="mt-0.5"><User size={16}/></div>
                      <div>
                        <strong>抽签已完成！</strong><br/>
                        找到你的名字，点击查看你的神秘任务。
                      </div>
                   </div>
                   
                   <div className="grid grid-cols-2 gap-3 overflow-y-auto custom-scrollbar max-h-[350px] content-start">
                     {assignments.map((pair) => (
                       <button 
                        key={pair.giver.id} 
                        onClick={() => handleNameClick(pair)}
                        className="flex flex-col items-center justify-center p-4 bg-white border-2 border-gray-100 rounded-xl hover:border-red-500 hover:bg-red-50 hover:shadow-md transition-all group"
                       >
                          <div className="w-10 h-10 rounded-full bg-gray-100 group-hover:bg-red-100 text-gray-500 group-hover:text-red-600 flex items-center justify-center font-bold text-lg mb-2 transition-colors">
                            {pair.giver.name.charAt(0).toUpperCase()}
                          </div>
                          <span className="font-bold text-gray-700 group-hover:text-red-700 truncate w-full text-center">
                            {pair.giver.name}
                          </span>
                       </button>
                     ))}
                   </div>
                   
                   <div className="mt-auto pt-4">
                     <button 
                      onClick={resetGame}
                      className="w-full py-3 text-gray-400 hover:text-red-500 text-sm flex items-center justify-center gap-2 transition-colors"
                     >
                       <RotateCcw size={14} /> 结束游戏，重新开始
                     </button>
                   </div>
                 </>
               )}

               {/* 结果展示模式 */}
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
                      <EyeOff size={20} /> 隐藏结果
                    </button>
                 </div>
               )}
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
