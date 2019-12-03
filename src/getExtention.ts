import { getAudioUrl } from './utils';

export default (post: any): { ext: 'mp4' | 'jpg', contentUrl: string, contentUrlSound?: string } => {

  let crosspostData: any;

  if (post.crosspost_parent_list) {
    crosspostData = post.crosspost_parent_list[0];
  }

  if (post.preview && post.preview.reddit_video_preview || crosspostData && crosspostData.preview && crosspostData.preview.reddit_video_preview) {
    if (crosspostData) {
      const contentUrl = crosspostData.preview.reddit_video_preview.fallback_url;
      return { ext: 'mp4', contentUrl, contentUrlSound: getAudioUrl(contentUrl)};
    } else {
      const contentUrl = post.preview.reddit_video_preview.fallback_url;
      return { ext: 'mp4', contentUrl, contentUrlSound: getAudioUrl(contentUrl)};
    }
  } else if (post.media && post.media.reddit_video && post.media.reddit_video.fallback_url || crosspostData && crosspostData.media && crosspostData.media.reddit_video && crosspostData.media.reddit_video.fallback_url) {
    if (crosspostData) {
      const contentUrl = crosspostData.media.reddit_video.fallback_url;
      return { ext: 'mp4', contentUrl, contentUrlSound: getAudioUrl(contentUrl)};
    } else {
      const contentUrl = post.media.reddit_video.fallback_url;
      return { ext: 'mp4', contentUrl, contentUrlSound: getAudioUrl(contentUrl)};
    }
  } else {
    if (crosspostData) {
      const contentUrl = crosspostData.url;
      return { ext: 'jpg', contentUrl };
    } else {
      const contentUrl = post.url;
      return { ext: 'jpg', contentUrl };
    }
  }
}