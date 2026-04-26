import { NextRequest, NextResponse } from 'next/server'

// ─── GET: Content templates (static data) ───
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') || 'all' // all, video, caption, hashtag, script, audio

    const templates = {
      videoIdeas: [
        {
          id: 'vi-1',
          title: 'My First Gold Purchase',
          titleFa: '\u062e\u0631\u06cc\u062f \u0627\u0648\u0631 \u0627\u0648\u0644\u0645',
          description: 'Show your first gold purchase experience on Mili Gold, from registration to receiving gold in your wallet',
          descriptionFa: '\u062a\u062c\u0631\u0628\u0647 \u062e\u0631\u06cc\u062f \u0627\u0648\u0631 \u0627\u0648\u0644 \u062e\u0648\u062f \u0631\u0627 \u062f\u0631 \u0645\u06cc\u0644\u06cc \u06af\u0644\u062f \u0646\u0634\u0627\u0646 \u062f\u0647\u06cc\u062f',
          duration: '30-60s',
          difficulty: 'easy',
          estimatedReward: '1-2mg',
          tips: ['Show your screen', 'Express genuine excitement', 'Mention the price you paid'],
        },
        {
          id: 'vi-2',
          title: 'Gold Price Check Routine',
          titleFa: '\u0631\u0648\u062a\u06cc\u0646 \u0628\u0631\u0631\u0633\u06cc \u0642\u06cc\u0645\u062a \u0627\u0648\u0631',
          description: 'Show your daily routine of checking gold prices on Mili Gold and how it helps your investment decisions',
          descriptionFa: '\u0631\u0648\u062a\u06cc\u0646 \u0631\u0648\u0632\u0627\u0646\u0647 \u0628\u0631\u0631\u0633\u06cc \u0642\u06cc\u0645\u062a \u0627\u0648\u0631 \u062f\u0631 \u0645\u06cc\u0644\u06cc \u06af\u0644\u062f \u0631\u0627 \u0646\u0634\u0627\u0646 \u062f\u0647\u06cc\u062f',
          duration: '15-30s',
          difficulty: 'easy',
          estimatedReward: '1-2mg',
          tips: ['Use time-lapse effect', 'Show price trends', 'Add trending music'],
        },
        {
          id: 'vi-3',
          title: 'Micro Investing Challenge',
          titleFa: '\u0686\u0627\u0644\u0634 \u0633\u0631\u0645\u0627\u06cc\u0647\u200c\u06af\u0630\u0627\u0631\u06cc \u0645\u06cc\u06a9\u0631\u0648',
          description: 'Try investing small amounts daily for 30 days and show the accumulated gold',
          descriptionFa: '\u0628\u0631\u0627\u06cc 30 \u0631\u0648\u0632 \u0645\u0642\u0627\u062f\u06cc\u0631 \u06a9\u0648\u0686\u06a9 \u0633\u0631\u0645\u0627\u06cc\u0647\u200c\u06af\u0630\u0627\u0631\u06cc \u06a9\u0646\u06cc\u062f \u0648 \u0627\u0648\u0631 \u062c\u0645\u0639 \u0634\u062f\u0647 \u0631\u0627 \u0646\u0634\u0627\u0646 \u062f\u0647\u06cc\u062f',
          duration: '60-120s',
          difficulty: 'medium',
          estimatedReward: '4-5mg',
          tips: ['Track progress daily', 'Show final gold amount', 'Calculate ROI'],
        },
        {
          id: 'vi-4',
          title: 'Price Prediction Game Results',
          titleFa: '\u0646\u062a\u0627\u06cc\u062c \u0628\u0627\u0632\u06cc \u067e\u06cc\u0634\u200c\u0628\u06cc\u0646\u06cc \u0642\u06cc\u0645\u062a',
          description: 'Share your experience playing the daily price prediction game and your success rate',
          descriptionFa: '\u062a\u062c\u0631\u0628\u0647 \u0628\u0627\u0632\u06cc \u0631\u0648\u0632\u0627\u0646\u0647 \u067e\u06cc\u0634\u200c\u0628\u06cc\u0646\u06cc \u0642\u06cc\u0645\u062a \u0648 \u0646\u0631\u062e \u0645\u0648\u0641\u0642\u06cc\u062a \u062e\u0648\u062f \u0631\u0627 \u0628\u0647 \u0627\u0634\u062a\u0631\u0627\u06a9 \u0628\u06af\u0630\u0627\u0631\u06cc\u062f',
          duration: '30-45s',
          difficulty: 'medium',
          estimatedReward: '4-5mg',
          tips: ['Show prediction screen', 'Celebrate correct predictions', 'Mention XP earned'],
        },
        {
          id: 'vi-5',
          title: 'Emergency Sell Feature Demo',
          titleFa: '\u0646\u0645\u0627\u06cc\u0634 \u0648\u06cc\u0698\u06af\u06cc \u0641\u0631\u0648\u0634 \u0641\u0648\u0631\u06cc',
          description: 'Demonstrate the emergency sell feature and explain when it could be useful',
          descriptionFa: '\u0648\u06cc\u0698\u06af\u06cc \u0641\u0631\u0648\u0634 \u0641\u0648\u0631\u06cc \u0631\u0627 \u0646\u0634\u0627\u0646 \u062f\u0647\u06cc\u062f \u0648 \u062a\u0648\u0636\u06cc\u062d \u062f\u0647\u06cc\u062f \u06a9\u06cc \u0645\u0648\u0627\u0642\u0639 \u0645\u0641\u06cc\u062f \u0627\u0633\u062a',
          duration: '30-60s',
          difficulty: 'medium',
          estimatedReward: '4-5mg',
          tips: ['Show the sell flow', 'Explain the PIN security', 'Mention speed of transaction'],
        },
        {
          id: 'vi-6',
          title: 'Family Gold Saving Tips',
          titleFa: '\u0646\u06a9\u0627\u062a \u067e\u0631\u062f\u0627\u062e\u062a \u0627\u0648\u0631 \u062e\u0627\u0646\u0648\u0627\u062f\u06af\u06cc',
          description: 'Share how you use the family wallet feature to save gold with your family members',
          descriptionFa: '\u0646\u0634\u0627\u0646 \u062f\u0647\u06cc\u062f \u0686\u06af\u0648\u0646\u0647 \u0627\u0632 \u0648\u06cc\u0698\u06af\u06cc \u06a9\u06cc\u0641 \u062e\u0627\u0646\u0648\u0627\u062f\u06af\u06cc \u0628\u0631\u0627\u06cc \u067e\u0631\u062f\u0627\u062e\u062a \u0627\u0648\u0631 \u0628\u0627 \u0627\u0639\u0636\u0627\u06cc \u062e\u0627\u0646\u0648\u0627\u062f\u0647 \u0627\u0633\u062a\u0641\u0627\u062f\u0647 \u0645\u06cc\u200c\u06a9\u0646\u06cc\u062f',
          duration: '60-90s',
          difficulty: 'medium',
          estimatedReward: '4-5mg',
          tips: ['Include family members', 'Show shared goals', 'Highlight transparency'],
        },
      ],
      captionSuggestions: [
        {
          id: 'cap-1',
          text: 'Just bought my first gram of digital gold with Mili Gold! No stress, no storage worries. Pure investment in my pocket.',
          category: 'first purchase',
          engagement: 'high',
        },
        {
          id: 'cap-2',
          text: 'While everyone worries about inflation, I\'m stacking gold one micro-gram at a time. Mili Gold makes it so easy.',
          category: 'investment',
          engagement: 'high',
        },
        {
          id: 'cap-3',
          text: 'POV: You just discovered you can buy gold from your phone for as little as 50,000 tomans.',
          category: 'trending',
          engagement: 'viral',
        },
        {
          id: 'cap-4',
          text: 'Day 30 of my daily gold saving challenge on Mili Gold. Check out how much I\'ve accumulated!',
          category: 'challenge',
          engagement: 'medium',
        },
        {
          id: 'cap-5',
          text: 'This app is changing how Iranians invest in gold. Mili Gold - your digital gold wallet.',
          category: 'review',
          engagement: 'medium',
        },
        {
          id: 'cap-6',
          text: 'Emergency expense? No problem. Sold my gold in seconds with Mili Gold\'s emergency sell feature. Money in my bank account instantly.',
          category: 'feature',
          engagement: 'high',
        },
        {
          id: 'cap-7',
          text: 'My family and I are saving gold together. The Mili Gold family wallet is a game changer!',
          category: 'family',
          engagement: 'medium',
        },
        {
          id: 'cap-8',
          text: 'Tired of your money losing value? Start investing in gold today with Mili Gold. Link in bio to join!',
          category: 'referral',
          engagement: 'medium',
        },
      ],
      hashtagPacks: [
        {
          id: 'hp-1',
          name: 'General Gold',
          nameFa: '\u0627\u0648\u0631 \u0639\u0645\u0648\u0645\u06cc',
          hashtags: ['#MiliGold', '#GoldInvestment', '#DigitalGold', '#IranGold', '#GoldSavings', '#SmartInvesting', '#GoldPrice', '#TomanGold'],
          platform: 'instagram',
        },
        {
          id: 'hp-2',
          name: 'TikTok Viral',
          nameFa: '\u062a\u06cc\u06a9\u062a\u0627\u06a9 \u0648\u06cc\u0631\u0627\u0644',
          hashtags: ['#fyp', '#MiliGold', '#gold', '#investing', '#money', '#Iran', '#goldiran', '#crypto', '#fintech'],
          platform: 'tiktok',
        },
        {
          id: 'hp-3',
          name: 'YouTube SEO',
          nameFa: '\u0633\u0626\u0648 \u06cc\u0648\u062a\u06cc\u0648\u0628',
          hashtags: ['Mili Gold', 'digital gold Iran', 'gold investment app', 'buy gold online', 'gold savings', 'finTech Iran', '\u0645\u06cc\u0644\u06cc \u06af\u0644\u062f', '\u062e\u0631\u06cc\u062f \u0627\u0648\u0631'],
          platform: 'youtube',
        },
        {
          id: 'hp-4',
          name: 'Challenge',
          nameFa: '\u0686\u0627\u0644\u0634',
          hashtags: ['#30DayGoldChallenge', '#MiliGoldChallenge', '#GoldSavingChallenge', '#MicroInvesting', '#DailyGold'],
          platform: 'instagram',
        },
        {
          id: 'hp-5',
          name: 'Persian',
          nameFa: '\u0641\u0627\u0631\u0633\u06cc',
          hashtags: ['#\u0645\u06cc\u0644\u06cc_\u06af\u0644\u062f', '#\u0633\u0631\u0645\u0627\u06cc\u0647_\u06af\u0630\u0627\u0631\u06cc', '#\u0627\u0648\u0631', '#\u062e\u0631\u06cc\u062f_\u0627\u0648\u0631', '#\u0642\u06cc\u0645\u062a_\u0627\u0648\u0631', '#\u0630\u062e\u06cc\u0631\u0647_\u0627\u0648\u0631', '#\u0641\u06cc\u0646\u062a\u06a9'],
          platform: 'all',
        },
      ],
      trendingAudio: [
        {
          id: 'ta-1',
          name: 'Gold Digger Remix',
          platform: 'tiktok',
          trending: true,
          useCount: '50K+',
        },
        {
          id: 'ta-2',
          name: 'Money Motivation Beat',
          platform: 'instagram',
          trending: true,
          useCount: '120K+',
        },
        {
          id: 'ta-3',
          name: 'Persian Pop Mix 2024',
          platform: 'tiktok',
          trending: true,
          useCount: '80K+',
        },
        {
          id: 'ta-4',
          name: 'Cinematic Wealth Aesthetic',
          platform: 'all',
          trending: false,
          useCount: '25K+',
        },
        {
          id: 'ta-5',
          name: 'Tech App Reveal Sound',
          platform: 'instagram',
          trending: true,
          useCount: '200K+',
        },
      ],
      scripts: [
        {
          id: 'sc-1',
          title: 'App Walkthrough Script',
          titleFa: '\u0645\u062a\u0646 \u0645\u0639\u0631\u0641\u06cc \u0627\u067e\u0644\u06cc\u06a9\u06cc\u0634\u0646',
          duration: '60s',
          scenes: [
            {
              time: '0-5s',
              action: 'Hook - Show gold price on screen',
              narration: 'Did you know you can buy real gold with just 50,000 tomans from your phone?',
            },
            {
              time: '5-15s',
              action: 'Show Mili Gold app open',
              narration: 'Let me show you Mili Gold - Iran\'s first digital gold wallet app.',
            },
            {
              time: '15-30s',
              action: 'Show registration and first purchase',
              narration: 'Sign up in seconds, add your wallet, and start buying gold. It\'s that simple.',
            },
            {
              time: '30-45s',
              action: 'Show portfolio and price charts',
              narration: 'Track your gold in real-time, see live prices, and manage your portfolio all in one place.',
            },
            {
              time: '45-60s',
              action: 'CTA - Show referral link',
              narration: 'Start your gold journey today. Use my link in bio to get started with Mili Gold!',
            },
          ],
        },
        {
          id: 'sc-2',
          title: 'Before/After Savings Script',
          titleFa: '\u0645\u062a\u0646 \u0642\u0628\u0644/\u0628\u0639\u062f \u067e\u0631\u062f\u0627\u062e\u062a',
          duration: '45s',
          scenes: [
            {
              time: '0-10s',
              action: 'Before: Show empty bank account or cash',
              narration: 'Before Mili Gold, my money was just sitting there losing value to inflation.',
            },
            {
              time: '10-25s',
              action: 'Transition: Show using Mili Gold app daily',
              narration: 'Now, every day I invest a little in digital gold. Small amounts, big results over time.',
            },
            {
              time: '25-40s',
              action: 'After: Show growing gold portfolio',
              narration: 'Look at my portfolio now. My money is actually growing, protected by real gold.',
            },
            {
              time: '40-45s',
              action: 'CTA',
              narration: 'Download Mili Gold and start protecting your wealth today!',
            },
          ],
        },
      ],
    }

    // Filter by type if specified
    let result: Record<string, unknown> = {}
    if (type === 'all') {
      result = templates
    } else {
      const typeMap: Record<string, string> = {
        video: 'videoIdeas',
        caption: 'captionSuggestions',
        hashtag: 'hashtagPacks',
        script: 'scripts',
        audio: 'trendingAudio',
      }
      const key = typeMap[type]
      if (key && templates[key as keyof typeof templates]) {
        result = { [type]: templates[key as keyof typeof templates] }
      } else {
        result = templates
      }
    }

    return NextResponse.json({
      success: true,
      data: result,
    })
  } catch (error) {
    console.error('[Creator Templates GET]', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch templates' },
      { status: 500 }
    )
  }
}
