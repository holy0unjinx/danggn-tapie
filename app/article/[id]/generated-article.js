import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import ArticleBehavior from './article-behavior';
import ChatButton from './chat-button';
import './article-chat.css';

const header = readFileSync(join(process.cwd(), 'data/article-header.html'), 'utf8');
const footer = readFileSync(join(process.cwd(), 'data/article-footer.html'), 'utf8');

function RelatedCard({ article }) {
  return (
    <a href={`/article/${article.id}`} className="_4y5lbrx sprinkles_display_flex_base__1byufe82i">
      <div className="sprinkles_display_flex_base__1byufe82i sprinkles_flexDirection_column_base__1byufe8te sprinkles_gap_2_base__1byufe8qi f1uy1ca f1uy1c8 f1uy1cb f1uy1c6 f1uy1cd f1uy1c9">
        <div className="sprinkles_position_relative_base__1byufe86y">
          <div className="sprinkles_width_full_base__1byufe84q f1uy1ce sprinkles_overflow_hidden__1byufe819 sprinkles_position_relative_base__1byufe86y sprinkles_borderRadius_1.5_base__1byufe892 _1ry7q92">
            {article.image ? (
              <img className="f1uy1cg sprinkles_width_full_base__1byufe84q sprinkles_height_full_base__1byufe86u sprinkles_borderRadius_1.5_base__1byufe892" src={article.image} alt="" />
            ) : null}
          </div>
        </div>
        <div className="sprinkles_display_flex_base__1byufe82i sprinkles_gap_1_base__1byufe8qe sprinkles_alignItems_flexStart_base__1byufe8se sprinkles_flexDirection_column_base__1byufe8te">
          <div className="sprinkles_display_flex_base__1byufe82i sprinkles_color_neutral__1byufe81 sprinkles_width_full_base__1byufe84q sprinkles_alignItems_flexStart_base__1byufe8se sprinkles_flexDirection_column_base__1byufe8te sprinkles_gap_0.5_base__1byufe8s2">
            <span className="sprinkles_fontSize_200_base__1byufe8uu sprinkles_fontWeight_regular__1byufe81x sprinkles_lineHeight_body.medium_base__1byufe8w6 sprinkles_color_neutral__1byufe81 f1uy1ch sprinkles_overflow_hidden__1byufe819">{article.title}</span>
            <span className="sprinkles_fontSize_200_base__1byufe8uu sprinkles_fontWeight_semibold__1byufe81y sprinkles_lineHeight_body.medium_base__1byufe8w6 sprinkles_color_neutral__1byufe81 f1uy1ci sprinkles_fontWeight_bold__1byufe81z">{article.price}</span>
          </div>
          <div className="sprinkles_width_full_base__1byufe84q sprinkles_display_flex_base__1byufe82i">
            <span className="seed-tag-group__root seed-tag-group__root--size_t3 seed-tag-group__root--truncate_true">
              <span className="seed-tag-group-item__root seed-tag-group-item__root--size_t3 seed-tag-group-item__root--weight_regular seed-tag-group-item__root--tone_neutralSubtle">
                <span className="seed-tag-group-item__label seed-tag-group-item__label--size_t3 seed-tag-group-item__label--weight_regular seed-tag-group-item__label--tone_neutralSubtle">{article.region}</span>
              </span>
              <span aria-hidden="true" className="seed-tag-group__separator seed-tag-group__separator--size_t3 seed-tag-group__separator--truncate_true"> · </span>
              <span className="seed-tag-group-item__root seed-tag-group-item__root--size_t3 seed-tag-group-item__root--weight_regular seed-tag-group-item__root--tone_neutralSubtle" style={{ '--seed-box-flex-shrink': 0 }}>
                <span className="seed-tag-group-item__label seed-tag-group-item__label--size_t3 seed-tag-group-item__label--weight_regular seed-tag-group-item__label--tone_neutralSubtle">
                  <time dateTime={article.datetime} data-bumped={article.bumped ? 'true' : undefined} data-offset={article.offsetMinutes || undefined}>{article.time}</time>
                </span>
              </span>
            </span>
          </div>
        </div>
      </div>
    </a>
  );
}

export default function GeneratedArticle({ article, viewer, related = [] }) {
  const images = article.images?.length ? article.images : (article.image ? [article.image] : []);
  const seller = article.seller;
  const mine = Boolean(viewer && article.ownerId === viewer.id);

  return (
    <>
      <div dangerouslySetInnerHTML={{ __html: header }} />
      <main id="main-content" className="_1463i585" data-gnb-state="closed" style={{ '--_1463i580': '95px' }}>
        <article className="_4y5lbr0 sprinkles_display_flex_base__1byufe82i sprinkles_flexDirection_column_base__1byufe8te sprinkles_position_relative_base__1byufe86y sprinkles_marginBottom_16_base__1byufe8la sprinkles_marginBottom_24_medium__1byufe8lk sprinkles_marginBottom_32_large__1byufe8lp">
          <div className="_1j555bm0 sprinkles_backgroundColor_layerDefault__1byufe8n sprinkles_width_full_base__1byufe84q">
            <div className="sprinkles_display_none_base__1byufe822 sprinkles_display_block_medium__1byufe828 sprinkles_marginTop_4_base__1byufe8ia sprinkles_marginTop_8_medium__1byufe8is">
              <nav aria-label="중고거래 페이지 네비게이션" className="_1skoxdf0">
                <ol className="_1skoxdf1">
                  <li className="_1skoxdf2"><a href="/" className="_1skoxdf4">홈</a></li>
                  <li className="_1skoxdf2"><a href="/" className="_1skoxdf4">중고거래</a></li>
                  <li className="_1skoxdf2"><span className="_1skoxdf5" aria-current="page">{article.title}</span></li>
                </ol>
              </nav>
            </div>
            <div className="sprinkles_display_flex_base__1byufe82i sprinkles_flexDirection_column_base__1byufe8te sprinkles_flexDirection_row_medium__1byufe8t8 sprinkles_marginTop_0_base__1byufe8hu sprinkles_marginTop_4_medium__1byufe8ic">
              <section className="_4y5lbr2 sprinkles_position_relative_base__1byufe86y sprinkles_marginBottom_0_base__1byufe8jy sprinkles_marginBottom_4_medium__1byufe8kg sprinkles_marginBottom_12_large__1byufe8l9">
                <div className="sprinkles_borderRadius_1.5_medium__1byufe894 sprinkles_overflow_hidden__1byufe819">
                  <div className="sprinkles_overflow_hidden__1byufe819 sprinkles_width_full_base__1byufe84q sprinkles_position_relative_base__1byufe86y">
                    <div className="sprinkles_display_flex_base__1byufe82i sprinkles_width_full_base__1byufe84q" style={{ transform: 'translate3d(0px, 0px, 0px)' }}>
                      {images.length ? images.map((src) => (
                        <img key={src} src={src} alt="" className="_1wus0xp0 sprinkles_width_full_base__1byufe84q sprinkles_height_full_base__1byufe86u sprinkles_cursor_default__1byufe81n _1wus0xp1" />
                      )) : <div className="_1wus0xp0 f1uy1ce" />}
                    </div>
                    {images.length > 1 ? (
                      <>
                        <div className="sprinkles_display_none_base__1byufe822 sprinkles_display_block_medium__1byufe828">
                          <button type="button" aria-label="Previous item" className="_1wus0xp3 _1wus0xp2 sprinkles_position_absolute_base__1byufe872 sprinkles_top_50%__1byufe81r sprinkles_borderRadius_full_base__1byufe89a _1wus0xp4">이전</button>
                          <button type="button" aria-label="Next item" className="_1wus0xp6 _1wus0xp2 sprinkles_position_absolute_base__1byufe872 sprinkles_top_50%__1byufe81r sprinkles_borderRadius_full_base__1byufe89a _1wus0xp8">다음</button>
                        </div>
                        <ol className="_1wus0xpa sprinkles_paddingTop_6_base__1byufe8a2 sprinkles_paddingBottom_6_base__1byufe8c6 sprinkles_display_flex_base__1byufe82i sprinkles_flexWrap_nowrap_base__1byufe8tq sprinkles_justifyContent_center_base__1byufe8su sprinkles_alignItems_center_base__1byufe8si sprinkles_position_absolute_base__1byufe872 sprinkles_bottom_0__1byufe81s sprinkles_left_0__1byufe81t sprinkles_right_0__1byufe81v sprinkles_gap_2_base__1byufe8qi">
                          {images.map((src, index) => (
                            <li key={src} className="_1wus0xpb">
                              <button type="button" aria-label="Carousel indicator" className={`_1wus0xpc ${index === 0 ? '_1wus0xpd' : ''}`} />
                            </li>
                          ))}
                        </ol>
                      </>
                    ) : null}
                  </div>
                </div>
                {seller ? (
                  <div className="_4y5lbr1 sprinkles_marginLeft_4_base__1byufe8om sprinkles_marginLeft_6_small__1byufe8ov sprinkles_marginLeft_0_medium__1byufe8o8 sprinkles_marginRight_4_base__1byufe8mi sprinkles_marginRight_6_small__1byufe8mr sprinkles_marginRight_0_medium__1byufe8m4">
                    <div className="sprinkles_paddingTop_4_base__1byufe89u sprinkles_paddingBottom_4_base__1byufe8by sprinkles_display_flex_base__1byufe82i sprinkles_flexDirection_column_base__1byufe8te article-seller">
                      <div className="sprinkles_display_flex_base__1byufe82i sprinkles_justifyContent_spaceBetween_base__1byufe8t2 sprinkles_alignItems_center_base__1byufe8si sprinkles_gap_3_base__1byufe8qm">
                        <div className="r4hjxe0 r4hjxe1 r4hjxe6 r4hjxe8 r4hjxec _1rgv2434">
                          <span className="_1b4d5ac0 _1b4d5ac5 _1b4d5acc _1b4d5acg _1b4d5acm _1b4d5ac1" aria-hidden="true">
                            <img alt={`${seller.name}님의 프로필`} className="_1b4d5acn" src={seller.image} />
                          </span>
                          <div className="r4hjxed _1rgv2435">
                            <span className="r4hjxee r4hjxef r4hjxek r4hjxem r4hjxeq">{seller.name}</span>
                            <span className="r4hjxer r4hjxes r4hjxex r4hjxez r4hjxe13 _1rgv2436"><span>{seller.region}</span></span>
                          </div>
                        </div>
                        {mine
                          ? <span className="article-chat-mine">내가 올린 글</span>
                          : <ChatButton articleId={article.id} signedIn={Boolean(viewer)} />}
                      </div>
                    </div>
                  </div>
                ) : null}
              </section>
              <section className="_4y5lbr3 sprinkles_position_relative_base__1byufe86y sprinkles_display_flex_base__1byufe82i sprinkles_flexDirection_column_base__1byufe8te sprinkles_gap_5_base__1byufe8qu sprinkles_paddingTop_6_base__1byufe8a2 sprinkles_paddingTop_8_small__1byufe8ab sprinkles_paddingTop_0_medium__1byufe89g sprinkles_paddingBottom_6_base__1byufe8c6 sprinkles_paddingBottom_0_large__1byufe8bl sprinkles_paddingBottom_8_medium__1byufe8cg sprinkles_marginBottom_0_base__1byufe8jy sprinkles_marginBottom_8_medium__1byufe8kw sprinkles_marginBottom_16_large__1byufe8ld sprinkles_marginLeft_0_base__1byufe8o6 sprinkles_marginLeft_10_medium__1byufe8p8">
                <div className="sprinkles_display_flex_base__1byufe82i sprinkles_flexDirection_column_base__1byufe8te sprinkles_gap_2_base__1byufe8qi sprinkles_gap_3_small__1byufe8qn">
                  <div className="_4y5lbr4 sprinkles_fontWeight_bold__1byufe81z">
                    <h1 className="sprinkles_display_inline_base__1byufe82a">{article.title}</h1>
                  </div>
                  <h2 className="_4y5lbr9 sprinkles_display_flex_base__1byufe82i sprinkles_fontWeight_regular__1byufe81x">
                    {article.category ? <a className="_4y5lbrc" href="/">{article.category}</a> : null}
                    {article.category ? ' · ' : null}
                    <time dateTime={article.datetime} data-bumped={article.bumped ? 'true' : undefined} data-offset={article.offsetMinutes || undefined}>{article.time}</time>
                  </h2>
                  <h3 className="_4y5lbrd sprinkles_fontWeight_bold__1byufe81z">{article.price}</h3>
                </div>
                <p className="_4y5lbrf sprinkles_fontWeight_regular__1byufe81x sprinkles_color_neutral__1byufe81 sprinkles_textAlign_left_base__1byufe8u6" style={{ whiteSpace: 'pre-wrap' }}>
                  {article.description}
                </p>
                <span className="_1pwsqmm0 _1pwsqmm2">
                  <span className="_1pwsqmme _1pwsqmmf _1pwsqmmh">채팅 {article.chats}</span>
                  <span className="_1pwsqmmd"><span>·</span><span className="_1pwsqmme _1pwsqmmf _1pwsqmmh">관심 {article.likes}</span></span>
                  <span className="_1pwsqmmd"><span>·</span><span className="_1pwsqmme _1pwsqmmf _1pwsqmmh">조회 {article.views}</span></span>
                </span>
              </section>
            </div>
            {related.length ? (
              <section className="_4y5lbrl _1ry7q90 sprinkles_display_flex_base__1byufe82i sprinkles_flexDirection_column_base__1byufe8te sprinkles_marginTop_6_base__1byufe8ii sprinkles_marginTop_16_medium__1byufe8j8 sprinkles_gap_6_base__1byufe8qy sprinkles_gap_8_medium__1byufe8r8">
                <h2 className="sprinkles_fontSize_300_base__1byufe8uy sprinkles_fontSize_400_medium__1byufe8v4 sprinkles_fontWeight_bold__1byufe81z sprinkles_lineHeight_heading.medium_base__1byufe8vi sprinkles_lineHeight_heading.large_medium__1byufe8vo">근처 인기 중고거래</h2>
                <div className="_4y5lbrw _4y5lbrv sprinkles_overflow_hidden__1byufe819">
                  {related.map((item) => <RelatedCard key={item.id} article={item} />)}
                </div>
              </section>
            ) : null}
          </div>
        </article>
      </main>
      <div dangerouslySetInnerHTML={{ __html: footer }} />
      <ArticleBehavior />
    </>
  );
}
