interface PlatformBadgeProps {
  platform: string;
}

export function PlatformBadge({ platform }: PlatformBadgeProps) {
  const platformConfig: Record<string, { label: string; bgColor: string }> = {
    baidu: { label: '百度', bgColor: 'bg-[#DE5246]' },
    google: { label: 'Google', bgColor: 'bg-[#4285F4]' },
    bilibili: { label: 'B站', bgColor: 'bg-[#FF6B9D]' },
    zhihu: { label: '知乎', bgColor: 'bg-[#0066FF]' },
    weibo: { label: '微博', bgColor: 'bg-[#E6162D]' },
    douyin: { label: '抖音', bgColor: 'bg-black' },
    xiaohongshu: { label: '小红书', bgColor: 'bg-[#FF2442]' },
    youtube: { label: 'YouTube', bgColor: 'bg-[#FF0000]' },
    twitter: { label: 'Twitter', bgColor: 'bg-[#1DA1F2]' },
    unknown: { label: '其他', bgColor: 'bg-gray-500' },
  };

  const config = platformConfig[platform] || platformConfig.unknown;

  return (
    <span
      className={`${config.bgColor} text-white px-2 py-0.5 text-xs font-bold rounded-full`}
    >
      {config.label}
    </span>
  );
}
