// src/pages/WrongNotesPage.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { getWrongNotes } from '../services/database';
import './WrongNotesPage.css';

export default function WrongNotesPage() {
  const navigate = useNavigate();
  const user = useSelector((s) => s.auth.user);

  const [view, setView] = useState('list'); // list | detail
  const [notes, setNotes] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [current, setCurrent] = useState(null);
  const [picked, setPicked] = useState(null);

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);

  const load = async () => {
    try {
      setLoading(true);
      // API 명세서에 맞춰 페이지네이션 파라미터 추가
      const wrongNotes = await getWrongNotes(user?.id || 1, 1, 10);
      setNotes(wrongNotes || []);
      setFiltered(wrongNotes || []);
    } catch (error) {
      console.error('오답노트 로드 실패:', error);
      setErr(error.message);
      // 에러 시 빈 배열로 설정
      setNotes([]);
      setFiltered([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { 
    load(); 
  }, []);

  const onSearch = (e) => {
    const q = e.target.value.trim().toLowerCase();
    setFiltered(
      notes.filter(
        (n) =>
          n.question?.toLowerCase().includes(q) ||
          n.category?.toLowerCase().includes(q)
      )
    );
  };

  if (loading) {
    return (
      <div className="app">
        <section className="page">
          <div className="panel">
            <div className="loading">오답노트를 불러오는 중...</div>
          </div>
        </section>
      </div>
    );
  }

  if (err) {
    return (
      <div className="app">
        <section className="page">
          <div className="panel">
            <div className="error">
              <div className="icon">⚠️</div>
              <h2>오답노트를 불러올 수 없습니다</h2>
              <p>{err}</p>
              <button className="btn-primary" onClick={load}>
                다시 시도
              </button>
            </div>
          </div>
        </section>
      </div>
    );
  }

  if (notes.length === 0) {
    return (
      <div className="app">
        <section className="empty">
          <div className="icon">📝</div>
          <h2>아직 오답노트가 없습니다</h2>
          <p>퀴즈를 풀면서 틀린 문제들이 여기에 쌓입니다.</p>
          <button className="btn-primary" onClick={() => navigate('/quiz')}>
            퀴즈 풀러 가기
          </button>
        </section>
      </div>
    );
  }

  const List = () => (
    <section className="page">
      <div className="panel">
        <div className="panel-head">
          <div className="left">
            <span className="round">✖</span>
            <div>
              <div style={{ fontWeight: 900 }}>오답노트</div>
              <div style={{ color: '#8b97ad' }}>틀린 문제를 다시 학습하세요</div>
            </div>
          </div>
          <div className="total">총 오답 수 <b>{notes.length}</b></div>
        </div>

        <div className="search">
          <div className="inp">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#7b879b" strokeWidth="2">
              <circle cx="11" cy="11" r="7"></circle>
              <path d="M20 20l-3-3"></path>
            </svg>
            <input placeholder="문제 검색..." onChange={onSearch} />
          </div>
        </div>
      </div>

      <div className="list">
        {filtered.map((w) => (
          <article key={w.id} className="item" onClick={() => { setCurrent(w); setPicked(null); setView('detail'); }}>
            <div className="item-top">
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span className="badge">문제 {w.id}</span>
                <span>{(w.created_at || '').split('T')[0]}</span>
              </div>
              <span style={{ color: '#8fa0b5' }}>›</span>
            </div>
            <div className="item-ask">{w.question}</div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span className="chip">{w.category}</span>
              <span className="wrong-flag">✖ 오답</span>
            </div>
          </article>
        ))}
      </div>
    </section>
  );

  const Detail = () => {
    const p = {
      id: current?.id ?? 0,
      question: current?.question ?? '문제 정보 없음',
      explanation: current?.explanation ?? '해설 없음',
      options: current?.options ?? [],
      correct: current?.correct_index ?? -1,
      selected: current?.selected_index ?? -1,
      level: current?.category ?? '',
    };

    return (
      <section className="page">
        <div className="panel">
          <div className="panel-head">
            <div className="left">
              <span className="round">✖</span>
              <div>
                <div style={{ fontWeight: 900 }}>오답노트</div>
                <div style={{ color: '#8b97ad' }}>틀린 문제를 다시 학습하세요</div>
              </div>
            </div>
            <div className="total">총 오답 수 <b>{notes.length}</b></div>
          </div>

          <div className="problem-header">
            <div className="problem-info">
              <span className="problem-number">문제 {p.id}</span>
              <span className="badge">오답</span>
            </div>
            <div className="problem-category">{p.level}</div>
          </div>

          <div className="sec problem-desc">
            <h3>상황 설명</h3>
            <div className="desc-text">{p.explanation}</div>
          </div>

          <div className="sec qbox">
            <div className="qtitle">
              <h3>문제</h3>
              <div className="question-text">{p.question}</div>
            </div>
            <div className="options-container">
              {p.options.map((t, i) => (
                <div key={i} className={`option ${i === p.correct ? 'correct' : i === p.selected ? 'incorrect' : ''}`}>
                  <div className="num">{i + 1}</div>
                  <div className="text">{t}</div>
                </div>
              ))}
            </div>

            <div className="explanation-section">
              <div className="explain bad">
                <div style={{ fontWeight: 900, marginBottom: 6 }}>❌ 오답입니다!</div>
                <div style={{ lineHeight: 1.6, marginBottom: 12 }}>{p.explanation}</div>
                <div className="answer-info">
                  <div className="selected-answer"><span>선택한 답: </span><strong>{p.options[p.selected]}</strong></div>
                  <div className="correct-answer"><span>정답: </span><strong>{p.options[p.correct]}</strong></div>
                </div>
              </div>
            </div>
          </div>

          <div className="backbar">
            <button className="btn-ghost" onClick={() => { setCurrent(null); setView('list'); }}>
              ← 목록으로 돌아가기
            </button>
          </div>
        </div>
      </section>
    );
  };

  return <div className="app">{view === 'list' ? <List /> : <Detail />}</div>;
}
