import React, { useState } from 'react';
import { Gift, Trash2, UserPlus, Snowflake, Sparkles, Eye, EyeOff, RotateCcw } from 'lucide-react';

const SecretSantaApp = () => {
  const [participants, setParticipants] = useState([]);
  const [currentName, setCurrentName] = useState('');
  const [assignments, setAssignments] = useState([]);
  const [stage, setStage] = useState('input'); // 'input', 'shuffling', 'result'
  const [revealedCard, setRevealedCard] = useState(null); // ID of the person whose target is currently revealed
  const [error, setError] = useState('');

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
      // Fisher-Yates 洗牌算法
      const shuffled = [...participants];
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }

      const newAssignments = [];
      for (let i = 0; i < shuffled.length; i++) {
        const giver = shuffled[i];
        // 形成一个闭环链条：A->B, B->C, ..., Z->A
        // 这样保证每个人既是送礼者也是收礼者，且不会抽到自己
        const receiver = shuffled[(i + 1) % shuffled.length];
        
        newAssignments.push({
          giver: giver,
          receiver: receiver
        });
      }

      // 将结果按送礼者名字排序，方便查找
      newAssignments.sort((a, b) => a.giver.name.localeCompare(b.giver.name));
      
      setAssignments(newAssignments);
      setStage('result');
    }, 1500); // 模拟洗牌动画时间
  };

  const resetGame = () => {
    setAssignments([]);
    setStage('input');
    setRevealedCard(null);
    setError('');
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

      <div className="w-full max-w-md bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl overflow-hidden border-t-4 border-red-600 z-10">
        
        {/* 头部 */}
        <div className="bg-gradient-to-r from-red-600 to-red-700 p-6 text-center relative">
          <div className="absolute top-2 right-2">
            <Snowflake className="text-white/30 animate-spin" size={40} />
          </div>
          <h1 className="text-3xl font-bold text-white flex items-center justify-center gap-2">
            <Gift className="text-yellow-300" />
            神秘圣诞老人
          </h1>
          <p className="text-red-100 text-sm mt-2">最公平、最有趣的礼物交换助手</p>
        </div>

        {/* 主要内容区域 */}
        <div className="p-6">
          
          {stage === 'input' && (
            <div className="space-y-6">
              {/* 输入框 */}
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

              {/* 名单列表 */}
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

              {/* 开始按钮 */}
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
            <div className="flex flex-col items-center justify-center h-[400px] space-y-6">
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
            <div className="space-y-4 animate-fadeIn">
               <div className="bg-yellow-50 border border-yellow-100 rounded-lg p-4 text-sm text-yellow-800 flex gap-3 items-start">
                  <div className="mt-0.5"><EyeOff size={16}/></div>
                  <div>
                    <strong>防剧透模式：</strong> 找到你的名字，点击查看你要送礼的对象。记住后再次点击隐藏，然后把屏幕传给下一个人。
                  </div>
               </div>

               <div className="max-h-[400px] overflow-y-auto space-y-3 pr-1 custom-scrollbar">
                 {assignments.map((pair) => (
                   <div key={pair.giver.id} className="bg-white border border-gray-100 rounded-xl overflow-hidden shadow-sm">
                     <button 
                      onClick={() => setRevealedCard(revealedCard === pair.giver.id ? null : pair.giver.id)}
                      className={`w-full p-4 flex items-center justify-between transition-colors ${revealedCard === pair.giver.id ? 'bg-red-50' : 'hover:bg-gray-50'}`}
                     >
                       <div className="flex items-center gap-3">
                          <span className="text-xs font-bold bg-gray-200 text-gray-600 px-2 py-1 rounded">我是</span>
                          <span className="font-bold text-lg text-gray-800">{pair.giver.name}</span>
                       </div>
                       <div className="flex items-center gap-2 text-sm text-gray-500">
                         {revealedCard === pair.giver.id ? (
                           <>点击隐藏 <EyeOff size={16} /></>
                         ) : (
                           <>点击查看 <Eye size={16} /></>
                         )}
                       </div>
                     </button>
                     
                     {revealedCard === pair.giver.id && (
                       <div className="p-6 bg-gradient-to-r from-red-500 to-red-600 text-center animate-slideDown">
                          <p className="text-red-100 text-sm mb-1">你的神秘礼物要送给</p>
                          <div className="text-3xl font-bold text-white flex items-center justify-center gap-2 my-2">
                            <Gift className="animate-pulse text-yellow-300" />
                            {pair.receiver.name}
                          </div>
                          <p className="text-white/60 text-xs">嘘！不要告诉别人哦</p>
                       </div>
                     )}
                   </div>
                 ))}
               </div>

               <button 
                onClick={resetGame}
                className="w-full mt-4 border-2 border-gray-200 hover:border-red-500 hover:text-red-600 text-gray-500 font-bold py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
               >
                 <RotateCcw size={18} />
                 重新开始
               </button>
            </div>
          )}

        </div>
        
        {/* 底部版权 */}
        <div className="bg-gray-50 p-3 text-center text-xs text-gray-400 border-t border-gray-100">
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
        @keyframes slideDown {
          from { opacity: 0; height: 0; }
          to { opacity: 1; height: auto; }
        }
        .animate-slideDown {
          animation: slideDown 0.3s ease-out forwards;
        }
        .animate-spin-slow {
          animation: spin 8s linear infinite;
        }
      `}</style>
    </div>
  );
};

export default SecretSantaApp;
