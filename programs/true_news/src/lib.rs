use anchor_lang::prelude::*;

declare_id!("2HRSoFY9Dru9twGMrpou3pvrqaQfdjhk6GpnK1fqwPNx");

#[program]
pub mod true_news {
    use super::*;

    pub fn publish_news(
        publish_news_ctx: Context<PublishANews>,
        headline_content: String,
        news_content: String,
    ) -> Result<()> {
        if headline_content.chars().count() > 50 {
            return err!(NewsErrors::HeadlineTooLong);
        }
        if news_content.chars().count() > 280 {
            return err!(NewsErrors::NewsContentTooLong);
        }

        let my_news = &mut publish_news_ctx.accounts.my_news;
        let publisher_of_news = &publish_news_ctx.accounts.publisher_of_news;
        let clock = Clock::get().unwrap();

        my_news.channel = *publisher_of_news.key;
        my_news.timestamp = clock.unix_timestamp;
        my_news.headline = headline_content;
        my_news.news = news_content;

        Ok(())
    }
}

#[error_code]
pub enum NewsErrors {
    #[msg("the news headline should be less than 80 characters")]
    HeadlineTooLong,
    #[msg("the news content should be less than 200 characters")]
    NewsContentTooLong,
}

#[derive(Accounts)]
pub struct Initialize {}

#[derive(Accounts)]
pub struct PublishANews<'info> {
    #[account(init, payer=publisher_of_news, space=News::LEN)]
    pub my_news: Account<'info, News>,

    #[account(mut)]
    pub publisher_of_news: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[account]
pub struct News {
    pub channel: Pubkey,
    pub timestamp: i64,
    pub headline: String,
    pub news: String,
}

const DICRIMINATOR_LENGTH: usize = 8;
const PUBLIC_KEY_LENGTH: usize = 32;
const TIMESTAMP_LENGTH: usize = 8;
const STRING_LENGTH_PREFIX: usize = 4;
const MAX_HEADLINE_LENGTH: usize = 50 * 44;
const MAX_NEWS_LENGTH: usize = 200 * 4;

impl News {
    const LEN: usize = DICRIMINATOR_LENGTH
        + PUBLIC_KEY_LENGTH
        + TIMESTAMP_LENGTH
        + STRING_LENGTH_PREFIX
        + MAX_HEADLINE_LENGTH
        + STRING_LENGTH_PREFIX
        + MAX_NEWS_LENGTH;
}
