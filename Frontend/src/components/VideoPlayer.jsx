// src/components/VideoPlayer.jsx
import React from 'react';

const VideoPlayer = ({ video }) => {
  if (!video || !video.video_url) {
    return <div className="video-placeholder">비디오를 불러올 수 없습니다.</div>;
  }

  // YouTube URL 처리
  const getYouTubeEmbedUrl = (url) => {
    const videoId = extractVideoId(url);
    return videoId ? `https://www.youtube.com/embed/${videoId}` : null;
  };

  // YouTube 비디오 ID 추출
  const extractVideoId = (url) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return match && match[2].length === 11 ? match[2] : null;
  };

  // URL 종류별 처리
  const renderVideo = () => {
    const url = video.video_url;

    // YouTube 비디오
    if (url.includes('youtube.com') || url.includes('youtu.be')) {
      const embedUrl = getYouTubeEmbedUrl(url);
      if (embedUrl) {
        return (
          <iframe
            width="100%"
            height="315"
            src={embedUrl}
            title={video.title || "YouTube video player"}
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            style={{ borderRadius: '8px' }}
          ></iframe>
        );
      }
    }

    // Vimeo 비디오
    if (url.includes('vimeo.com')) {
      const vimeoId = url.split('/').pop();
      const embedUrl = `https://player.vimeo.com/video/${vimeoId}`;
      return (
        <iframe
          src={embedUrl}
          width="100%"
          height="315"
          frameBorder="0"
          allow="autoplay; fullscreen; picture-in-picture"
          allowFullScreen
          title={video.title || "Vimeo video player"}
          style={{ borderRadius: '8px' }}
        ></iframe>
      );
    }

    // 직접 비디오 파일 (mp4, webm, ogg 등)
    if (url.match(/\.(mp4|webm|ogg)(\?.*)?$/i)) {
      return (
        <video
          controls
          width="100%"
          height="315"
          style={{ borderRadius: '8px' }}
          preload="metadata"
        >
          <source src={url} type="video/mp4" />
          <p>Your browser does not support the video tag.</p>
        </video>
      );
    }

    // 기타 외부 링크 (Google Drive, 기타 플랫폼)
    return (
      <div className="external-video-container" style={{ 
        border: '2px dashed #ddd', 
        padding: '20px', 
        textAlign: 'center',
        borderRadius: '8px',
        backgroundColor: '#f9f9f9'
      }}>
        <p>외부 비디오 링크</p>
        <a 
          href={url} 
          target="_blank" 
          rel="noopener noreferrer"
          style={{
            display: 'inline-block',
            padding: '10px 20px',
            backgroundColor: '#007bff',
            color: 'white',
            textDecoration: 'none',
            borderRadius: '5px',
            marginTop: '10px'
          }}
        >
          비디오 보기 →
        </a>
        {video.thumbnail_url && (
          <div style={{ marginTop: '10px' }}>
            <img 
              src={video.thumbnail_url} 
              alt={video.title || "Video thumbnail"}
              style={{ maxWidth: '200px', borderRadius: '4px' }}
            />
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="video-player">
      <div className="video-container">
        {renderVideo()}
      </div>
      
      {/* 비디오 메타데이터 표시 */}
      <div className="video-metadata" style={{ marginTop: '15px', padding: '10px', backgroundColor: '#f8f9fa', borderRadius: '5px' }}>
        <h3 style={{ margin: '0 0 10px 0', fontSize: '18px', fontWeight: 'bold' }}>
          {video.title || "제목 없음"}
        </h3>
        
        {video.description && (
          <p style={{ margin: '5px 0', color: '#666', fontSize: '14px' }}>
            {video.description}
          </p>
        )}
        
        <div style={{ display: 'flex', gap: '15px', fontSize: '12px', color: '#888', marginTop: '10px' }}>
          {video.difficulty && (
            <span>
              난이도: <strong>{video.difficulty === 1 ? '상' : video.difficulty === 2 ? '중' : '하'}</strong>
            </span>
          )}
          
          {video.duration_sec && (
            <span>
              길이: <strong>{Math.floor(video.duration_sec / 60)}분 {video.duration_sec % 60}초</strong>
            </span>
          )}
          
          {video.created_at && (
            <span>
              등록일: <strong>{new Date(video.created_at).toLocaleDateString('ko-KR')}</strong>
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default VideoPlayer;