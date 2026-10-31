'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

const categories = ['디지털기기', '가구/인테리어', '생활/주방', '의류', '도서', '스포츠/레저', '뷰티/미용', '기타'];

export default function WriteForm() {
  const router = useRouter();
  const [photos, setPhotos] = useState([]);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('');
  const [price, setPrice] = useState('');
  const [free, setFree] = useState(false);
  const [description, setDescription] = useState('');
  const [region, setRegion] = useState('정자동');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const urls = useRef(new Set());

  useEffect(() => () => {
    urls.current.forEach((url) => URL.revokeObjectURL(url));
  }, []);

  function addPhotos(event) {
    const selected = [...event.target.files];
    if (selected.some((file) => !['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > 10 * 1024 * 1024)) {
      setError('JPG, PNG, WEBP 사진을 장당 10MB 이하로 선택해 주세요.');
      event.target.value = '';
      return;
    }
    const available = 5 - photos.length;
    if (selected.length > available) setError('사진은 최대 5장까지 올릴 수 있어요.');
    else setError('');
    const additions = selected.slice(0, available).map((file) => {
      const url = URL.createObjectURL(file);
      urls.current.add(url);
      return { file, url };
    });
    setPhotos((current) => [...current, ...additions]);
    event.target.value = '';
  }

  function removePhoto(url) {
    URL.revokeObjectURL(url);
    urls.current.delete(url);
    setPhotos((current) => current.filter((photo) => photo.url !== url));
  }

  async function submit(event) {
    event.preventDefault();
    if (!photos.length) {
      setError('사진을 한 장 이상 올려 주세요.');
      return;
    }
    if (!free && (!price || Number(price) < 1)) {
      setError('가격을 입력하거나 나눔을 선택해 주세요.');
      return;
    }
    setError('');
    setSaving(true);
    const data = new FormData();
    data.set('title', title.trim());
    data.set('category', category);
    data.set('price', price);
    data.set('free', String(free));
    data.set('description', description.trim());
    data.set('region', region.trim());
    photos.forEach(({ file }) => data.append('photos', file));
    try {
      const response = await fetch('/api/articles', { method: 'POST', body: data });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || '글을 저장하지 못했어요.');
      router.push(`/article/${result.article.id}`);
    } catch (cause) {
      setError(cause.message || '글을 저장하지 못했어요.');
      setSaving(false);
    }
  }

  return (
    <form className="write-form" onSubmit={submit}>
      <section className="write-field">
        <h2>사진 <span className="write-required">*</span><span className="write-count">{photos.length}/5</span></h2>
        <div className="write-photo-list">
          {photos.length < 5 && (
            <label htmlFor="write-photos" className="write-upload-tile">
              <svg viewBox="0 0 24 24" width="28" height="28" fill="none" aria-hidden="true"><path d="M4 7.5h3l1.5-2h7L17 7.5h3a1.5 1.5 0 0 1 1.5 1.5v9A1.5 1.5 0 0 1 20 19.5H4A1.5 1.5 0 0 1 2.5 18V9A1.5 1.5 0 0 1 4 7.5Z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round"/><circle cx="12" cy="13.2" r="3" stroke="currentColor" strokeWidth="1.7"/></svg>
              <span>사진 추가</span>
            </label>
          )}
          <input id="write-photos" className="write-visually-hidden" type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={addPhotos} aria-label="상품 사진 추가" />
          {photos.map(({ file, url }, index) => (
            <div className="write-photo-tile" key={url}>
              <img src={url} alt={`${index + 1}번째 사진: ${file.name}`} />
              {index === 0 && <span className="write-cover">대표 사진</span>}
              <button type="button" className="write-photo-remove" aria-label={`${index + 1}번째 사진 삭제`} onClick={() => removePhoto(url)}>×</button>
            </div>
          ))}
        </div>
        <p className="write-help">첫 번째 사진이 목록의 대표 사진으로 보여요.</p>
      </section>

      <section className="write-field">
        <label htmlFor="write-title">제목 <span className="write-required">*</span></label>
        <input id="write-title" className="write-control" value={title} onChange={(event) => setTitle(event.target.value)} placeholder="물건 이름을 입력해 주세요" maxLength={80} required />
      </section>

      <section className="write-field">
        <label htmlFor="write-category">카테고리 <span className="write-required">*</span></label>
        <select id="write-category" className="write-control write-select" value={category} onChange={(event) => setCategory(event.target.value)} required>
          <option value="">카테고리를 선택해 주세요</option>
          {categories.map((item) => <option key={item} value={item}>{item}</option>)}
        </select>
      </section>

      <section className="write-field">
        <label htmlFor="write-price">가격 <span className="write-required">*</span></label>
        <div className="write-price-row">
          <div className="write-price-input">
            <input id="write-price" className="write-control" inputMode="numeric" value={free ? '' : price ? Number(price).toLocaleString('ko-KR') : ''} onChange={(event) => setPrice(event.target.value.replace(/\D/g, '').slice(0, 10))} placeholder="가격을 입력해 주세요" disabled={free} aria-label="가격" />
            {!free && <span>원</span>}
          </div>
          <label className={`write-free ${free ? 'is-active' : ''}`}><input type="checkbox" checked={free} onChange={(event) => setFree(event.target.checked)} />나눔</label>
        </div>
      </section>

      <section className="write-field">
        <label htmlFor="write-description">자세한 설명 <span className="write-required">*</span></label>
        <textarea id="write-description" className="write-control write-textarea" value={description} onChange={(event) => setDescription(event.target.value)} maxLength={2000} required placeholder="물건의 상태와 사용 기간 등을 자세히 적어 주세요." />
        <p className="write-help write-length">{description.length}/2000</p>
      </section>

      <section className="write-field">
        <label htmlFor="write-region">거래 동네 <span className="write-required">*</span></label>
        <input id="write-region" className="write-control" value={region} onChange={(event) => setRegion(event.target.value)} placeholder="거래할 동네를 입력해 주세요" maxLength={40} required />
      </section>

      {error && <p className="write-error" role="alert">{error}</p>}
      <div className="write-actions">
        <a href="/" className="write-cancel">취소</a>
        <button type="submit" className="seed-action-button seed-action-button--variant_brandSolid seed-action-button--size_large seed-action-button--layout_withText seed-action-button--size_large-layout_withText write-submit" disabled={saving}>{saving ? '올리는 중...' : '글 올리기'}</button>
      </div>
    </form>
  );
}
