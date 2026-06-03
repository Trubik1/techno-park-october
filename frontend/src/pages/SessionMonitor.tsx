import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { exportSessionResultsToCsv, downloadCsv } from '../utils/csvExport';
import QRCode from 'qrcode';
import { useToast } from '../components/Toast';
import Breadcrumbs from '../components/Breadcrumbs';

function parseBackendDate(dateStr: string | null | undefined): Date {
  if (!dateStr) return new Date();
  return new Date(dateStr + (dateStr.endsWith('Z') || dateStr.includes('+') ? '' : 'Z'));
}

interface SessionData {
  id: string; quiz_id: string; code: string; status: string;
  started_at: string; closed_at: string | null;
  title?: string; subject?: string; grade?: string;
}

interface Participant {
  student_id: string; display_name: string; class_name: string;
  joined_at: string; completed_at: string | null;
  score: number | null; total_questions: number;
}

function playBeep() {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = 660;
    osc.type = 'sine';
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.15);
  } catch { /* audio not available */ }
}

const SessionMonitor: React.FC = () => {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const prevCountRef = useRef(0);
  const [sessionData, setSessionData] = useState<SessionData | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshCountdown, setRefreshCountdown] = useState(5);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [qrModal, setQrModal] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [monitorTab, setMonitorTab] = useState<'participants' | 'leaderboard'>('participants');
  const [leaderboard, setLeaderboard] = useState<{ rank: number; student_name: string; score: number; total: number; percentage: number }[]>([]);
  const refreshIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const countdownIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchSessionData = async () => {
    try {
      setIsLoading(true);
      const sessionResponse = await fetch(`/api/sessions/${code}`);
      if (!sessionResponse.ok) {
        if (sessionResponse.status === 404) setError('Сессия не найдена. Возможно, она была удалена или код неверен.');
        else setError('Ошибка загрузки данных сессии.');
        return;
      }
      const sessionInfo = await sessionResponse.json();
      const quizResponse = await fetch(`/api/quizzes/${sessionInfo.quiz_id}`);
      if (!quizResponse.ok) throw new Error('Не удалось загрузить информацию о тесте');
      const quizInfo = await quizResponse.json();
      setSessionData({ ...sessionInfo, ...quizInfo, id: sessionInfo.id, quiz_id: sessionInfo.quiz_id, code: sessionInfo.code, status: sessionInfo.status, started_at: sessionInfo.started_at, closed_at: sessionInfo.closed_at });
      const participantsResponse = await fetch(`/api/sessions/${sessionInfo.id}/participants`);
      if (!participantsResponse.ok) throw new Error('Не удалось загрузить участников');
      const participantsData = await participantsResponse.json();
      const mapped = participantsData.map((p: any) => ({
        student_id: p.student_id, display_name: p.display_name, class_name: p.class_name,
        joined_at: p.joined_at, completed_at: p.completed_at,
        score: p.score, total_questions: p.total_questions || 0
      }));
      if (mapped.length > prevCountRef.current && prevCountRef.current > 0) {
        playBeep();
        showToast(`+1 участник: ${mapped[mapped.length - 1].display_name}`);
      }
      prevCountRef.current = mapped.length;
      setParticipants(mapped);

      const lbRes = await fetch(`/api/sessions/${sessionInfo.id}/leaderboard`);
      if (lbRes.ok) setLeaderboard(await lbRes.json());
    } catch (err) {
      setError('Не удалось загрузить данные сессии. Проверьте подключение и попробуйте снова.');
    } finally { setIsLoading(false); }
  };

  useEffect(() => {
    if (!code) { navigate('/teacher/dashboard'); return; }
    fetchSessionData();
    return () => {
      if (refreshIntervalRef.current) clearInterval(refreshIntervalRef.current);
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    };
  }, [code, navigate]);

  useEffect(() => {
    if (refreshIntervalRef.current) clearInterval(refreshIntervalRef.current);
    if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    if (!autoRefresh) return;
    setRefreshCountdown(5);
    countdownIntervalRef.current = setInterval(() => {
      setRefreshCountdown(prev => (prev > 1 ? prev - 1 : 5));
    }, 1000);
    refreshIntervalRef.current = setInterval(() => {
      if (!sessionData || sessionData.status === 'closed') return;
      fetchSessionData();
    }, 5000);
    return () => {
      if (refreshIntervalRef.current) clearInterval(refreshIntervalRef.current);
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    };
  }, [autoRefresh, sessionData?.status]);

  useEffect(() => {
    if (!qrModal || !sessionData) return;
    const url = `${window.location.origin}/student/quiz/${sessionData.code}`;
    QRCode.toDataURL(url, { width: 400, margin: 2, color: { dark: '#1E293B', light: '#FFFFFF' } })
      .then(setQrDataUrl)
      .catch(() => setQrDataUrl(''));
  }, [qrModal, sessionData]);

  const handleCloseSession = useCallback(async () => {
    if (!sessionData) return;
    if (!window.confirm('Вы уверены, что хотите завершить эту сессию? Это действие нельзя отменить.')) return;
    try {
      const response = await fetch(`/api/sessions/${sessionData.id}/close`, { method: 'POST' });
      if (!response.ok) throw new Error('Не удалось завершить сессию');
      setSessionData(prev => prev ? { ...prev, status: 'closed' } : null);
    } catch {
      setError('Не удалось завершить сессию. Пожалуйста, попробуйте снова.');
    }
  }, [sessionData]);

  if (isLoading && !sessionData) {
    return (
      <div className="page-container flex items-center justify-center">
        <div className="text-center animate-fadeIn">
          <div className="spinner mx-auto mb-4"></div>
          <p className="text-text-secondary">Загрузка данных сессии...</p>
        </div>
      </div>
    );
  }

  if (error && !sessionData) {
    return (
      <div className="page-container flex items-center justify-center">
        <div className="page-card animate-scaleIn">
          <div className="error-box mb-4">
            <h3 className="font-bold text-text-primary mb-1">Ошибка</h3>
            <p className="text-text-secondary text-sm">{error}</p>
          </div>
          <button onClick={() => navigate('/teacher/dashboard')} className="btn-primary w-full">Вернуться к дашборду</button>
        </div>
      </div>
    );
  }

  if (!sessionData) {
    return (
      <div className="page-container flex items-center justify-center">
        <div className="text-center animate-fadeIn">
          <p className="text-text-secondary mb-4">Сессия не найдена</p>
          <button onClick={() => navigate('/teacher/dashboard')} className="btn-primary">Вернуться к дашборду</button>
        </div>
      </div>
    );
  }

  const isActive = sessionData.status === 'active';
  const totalStudents = participants.length;
  const completedStudents = participants.filter(p => p.completed_at);
  const averageScore = completedStudents.length > 0 ? Math.round((completedStudents.reduce((sum, p) => sum + (p.score || 0), 0) / completedStudents.length) * 10) / 10 : 0;
  const completionRate = totalStudents > 0 ? Math.round((completedStudents.length / totalStudents) * 100) : 0;

  return (
    <div className="page-container">
      <div className="max-w-6xl mx-auto">
        <Breadcrumbs items={[
          { label: 'Вход учителя', path: '/teacher/login' },
          { label: 'Панель управления', path: '/teacher/dashboard' },
          { label: 'Монитор сессии' },
        ]} />
        <div className="card animate-slideUp">
        <div className="gradient-header">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
            <div>
              <h1 className="text-2xl font-bold">{sessionData.title || 'Мониторинг сессии'}</h1>
              <p className="text-sm text-white/80">{sessionData.subject} {sessionData.grade}</p>
              <div className="mt-3 inline-flex items-center gap-2 bg-white/15 rounded-xl px-4 py-2">
                <span className="text-xs text-white/70">Код сессии:</span>
                <span className="text-2xl font-bold tracking-[0.15em] font-mono text-white cursor-pointer hover:opacity-80" onClick={async () => { try { await navigator.clipboard.writeText(sessionData.code); showToast('Код скопирован'); } catch { showToast('Ошибка копирования', 'error'); } }} title="Нажмите, чтобы скопировать">{sessionData.code}</span>
                <button onClick={() => setQrModal(true)} className="ml-1 inline-flex items-center gap-1 text-xs bg-white/15 hover:bg-white/25 px-2 py-1 rounded-lg transition-colors" title="Показать QR-код">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" /></svg>
                  QR
                </button>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className={`px-3 py-1 text-xs font-semibold rounded-full ${isActive ? 'bg-success/20 text-success' : participants.length > 0 && participants.every(p => p.completed_at) ? 'bg-blue-500/20 text-blue-500' : 'bg-error/20 text-error'}`}>
                {isActive ? 'Активна' : participants.length > 0 && participants.every(p => p.completed_at) ? 'Завершена (все сдали)' : 'Завершена'}
              </span>
              {isActive && (
                <button onClick={handleCloseSession} className="btn-sm bg-white/20 text-white hover:bg-white/30 transition-colors rounded-lg">Завершить сессию</button>
              )}
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm text-white/80">
            <div><span className="font-medium">Начало:</span> {parseBackendDate(sessionData.started_at).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}</div>
            <div><span className="font-medium">Длительность:</span> {Math.floor((Date.now() - parseBackendDate(sessionData.started_at).getTime()) / 60000)} мин</div>
            <div className="flex items-center gap-2">
              <span className="font-medium">Обновлено:</span> {new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
              {isActive && (
                <button onClick={() => setAutoRefresh(!autoRefresh)} className={`text-xs px-2 py-0.5 rounded-full transition-colors ${autoRefresh ? 'bg-success/20 text-success' : 'bg-gray-500/20 text-gray-400'}`} title={autoRefresh ? 'Автообновление включено' : 'Автообновление выключено'}>
                  {autoRefresh ? `${refreshCountdown}с` : 'Пауза'}
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="p-6 bg-background/50 border-b border-gray-100">
          <div className="grid grid-cols-3 gap-4">
            <div className="stat-card"><p className="text-sm font-medium text-text-secondary">Участников</p><p className="text-2xl font-bold text-text-primary">{totalStudents}</p></div>
            <div className="stat-card"><p className="text-sm font-medium text-text-secondary">Средний балл</p><p className="text-2xl font-bold text-text-primary">{averageScore}</p></div>
            <div className="stat-card"><p className="text-sm font-medium text-text-secondary">Завершивших</p><p className="text-2xl font-bold text-text-primary">{completionRate}%</p></div>
          </div>
        </div>

        <div className="flex gap-1 px-6 pt-4">
          <button onClick={() => setMonitorTab('participants')} className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${monitorTab === 'participants' ? 'bg-primary text-white' : 'bg-gray-100 dark:bg-gray-700 text-text-secondary hover:bg-gray-200 dark:hover:bg-gray-600'}`}>
            Участники {participants.length > 0 && <span className="ml-1 text-xs opacity-70">({participants.length})</span>}
          </button>
          <button onClick={() => setMonitorTab('leaderboard')} className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${monitorTab === 'leaderboard' ? 'bg-primary text-white' : 'bg-gray-100 dark:bg-gray-700 text-text-secondary hover:bg-gray-200 dark:hover:bg-gray-600'}`}>
            Рейтинг {leaderboard.length > 0 && <span className="ml-1 text-xs opacity-70">({leaderboard.length})</span>}
          </button>
        </div>

        <div className="p-6">
          {monitorTab === 'participants' && (
            participants.length === 0 ? (
              <div className="text-center py-8 animate-fadeIn">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-background mb-4">
                  <svg className="w-8 h-8 text-text-secondary/40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <p className="text-text-secondary">Пока нет участников в этой сессии</p>
                <p className="mt-4 text-sm text-text-secondary/60">Ожидайте, пока ученики подключатся по коду:</p>
                <div className="mt-2 inline-flex items-center gap-2 bg-primary/10 rounded-xl px-5 py-3 border border-primary/20">
                  <span className="text-3xl font-bold tracking-[0.25em] font-mono text-primary">{sessionData.code}</span>
                </div>
              </div>
            ) : (
              <>
                <h2 className="text-xl font-bold text-text-primary mb-4">Участники <span className="text-sm font-normal text-text-secondary">({participants.length})</span></h2>
                <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-600">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-600">
                    <thead className="bg-gray-50 dark:bg-gray-800">
                      <tr>
                        {['Ученик', 'Класс', 'Балл', 'Статус', 'Время'].map(h => (
                          <th key={h} className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {participants.map((p, i) => (
                        <tr key={p.student_id} className="bg-white dark:bg-gray-800/50 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors animate-fadeIn" style={{ animationDelay: `${i * 0.05}s` }}>
                          <td className="px-4 py-3 text-sm font-medium text-text-primary">{p.display_name}</td>
                          <td className="px-4 py-3 text-sm text-text-secondary">{p.class_name}</td>
                          <td className="px-4 py-3 text-sm font-bold">
                            {p.completed_at ? (
                              <span className={`${p.score === 0 ? 'text-error' : p.score! >= p.total_questions * 0.8 ? 'text-success' : p.score! >= p.total_questions * 0.6 ? 'text-warning' : 'text-text-primary'}`}>
                                {p.score}/{p.total_questions}
                              </span>
                            ) : (
                              <span className="text-text-secondary/50">—</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-sm">
                            <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${p.completed_at ? 'bg-success/10 text-success' : 'bg-warning/10 text-warning'}`}>
                              {p.completed_at ? 'Завершил' : 'В процессе'}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm text-text-secondary">{p.completed_at ? parseBackendDate(p.completed_at).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }) : parseBackendDate(p.joined_at).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )
          )}

          {monitorTab === 'leaderboard' && (
            leaderboard.length === 0 ? (
              <div className="text-center py-8 animate-fadeIn">
                <p className="text-text-secondary">Нет данных для рейтинга. Участники ещё не завершили тест.</p>
              </div>
            ) : (
              <>
                <h2 className="text-xl font-bold text-text-primary mb-4">Рейтинг <span className="text-sm font-normal text-text-secondary">({leaderboard.length})</span></h2>
                <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-600">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-600">
                    <thead className="bg-gray-50 dark:bg-gray-800">
                      <tr>
                        {['Место', 'Ученик', 'Баллы', '%'].map(h => (
                          <th key={h} className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {leaderboard.map((entry, i) => (
                        <tr key={entry.rank} className="bg-white dark:bg-gray-800/50 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors animate-fadeIn" style={{ animationDelay: `${i * 0.05}s` }}>
                          <td className="px-4 py-3 text-sm">
                            <span className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold ${entry.rank === 1 ? 'bg-yellow-400 text-yellow-900' : entry.rank === 2 ? 'bg-gray-300 text-gray-700' : entry.rank === 3 ? 'bg-amber-600 text-white' : 'bg-gray-100 dark:bg-gray-700 text-text-secondary'}`}>
                              {entry.rank}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm font-medium text-text-primary">{entry.student_name}</td>
                          <td className="px-4 py-3 text-sm font-bold text-text-primary">{entry.score}/{entry.total}</td>
                          <td className="px-4 py-3 text-sm">
                            <span className={`font-semibold ${entry.percentage >= 80 ? 'text-success' : entry.percentage >= 60 ? 'text-warning' : 'text-error'}`}>
                              {entry.percentage}%
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )
          )}
        </div>

        <div className="p-6 border-t border-gray-100 dark:border-gray-600">
          <button
            onClick={() => {
              if (!sessionData || participants.length === 0) { showToast('Нет данных для экспорта', 'error'); return; }
              const exportData = participants.filter(p => p.completed_at).map(p => ({
                student_name: p.display_name, class_name: p.class_name, score: p.score || 0,
                total_questions: p.total_questions, completed_at: p.completed_at || '',
                percentage: p.total_questions > 0 ? Math.round(((p.score || 0) / p.total_questions) * 100) : 0
              }));
              const csvContent = exportSessionResultsToCsv(exportData, {
                title: sessionData.title || '', code: sessionData.code, subject: sessionData.subject || '',
                grade: sessionData.grade || '', started_at: sessionData.started_at
              });
              downloadCsv(csvContent, `classquiz_results_${sessionData.code}_${new Date().toISOString().slice(0, 10)}.csv`);
            }}
            className="btn-primary w-full"
          >
            📥 Экспортировать результаты (CSV)
          </button>
        </div>
      </div>

      {qrModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 animate-fadeIn" onClick={() => { setQrModal(false); setQrDataUrl(''); }}>
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-sm w-full text-center animate-scaleIn" onClick={e => e.stopPropagation()}>
            <p className="text-lg font-bold text-gray-900 mb-1">Подключиться к тесту</p>
            <p className="text-sm text-gray-500 mb-4">Отсканируйте код или введите код вручную</p>
            {qrDataUrl ? (
              <img src={qrDataUrl} alt="QR-код" className="mx-auto rounded-xl shadow-md" />
            ) : (
              <div className="w-64 h-64 mx-auto flex items-center justify-center bg-gray-100 rounded-xl">
                <div className="spinner"></div>
              </div>
            )}
            <div className="mt-4">
              <p className="text-xs text-gray-400 mb-1">или введите код</p>
              <p className="text-3xl font-bold tracking-[0.3em] text-primary font-mono">{sessionData?.code || ''}</p>
            </div>
            <button onClick={() => { setQrModal(false); setQrDataUrl(''); }} className="mt-6 text-sm text-gray-400 hover:text-gray-600 transition-colors">
              Закрыть
            </button>
          </div>
        </div>
      )}
    </div>
    </div>
  );
};

export default SessionMonitor;
