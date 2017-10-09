const crypto = require('crypto');
const fs = require('fs');
const RSS = require('rss');
const request = require('request-promise-native');

const sortBy = (accessors, type) =>
{
    return (a, b) =>
    {
        let itemA, itemB;

        for(const accessor of accessors)
        {
            itemA = a[accessor];
            itemB = b[accessor];
        }

        switch(type)
        {
            case 'date':
                itemA = new Date(itemA);
                itemB = new Date(itemB);
                break;
        }

        if(itemA < itemB)
        {
            return -1;
        }

        else if(itemA > itemB)
        {
            return 1;
        }

        else
        {
            return 0;
        }
    }
}

const main = async () =>
{
    const feed = new RSS(
    {
        title: 'Bittrex - open and available trading markets',
        feed_url: 'http://www.yourwebsite.com/feed.rss',
        site_url: 'https://bittrex.com',
        pubDate: new Date(),
        ttl: 1440
    });

    const response = await request(
    {
        method: 'GET',
        url: 'https://bittrex.com/api/v1.1/public/getmarkets',
        json: true
    });

    const results = response.result
    .filter((item) => item.BaseCurrency == 'BTC')
    .sort(sortBy(['MarketCurrency'], 'date'))
    .reverse();

    results.forEach((result) =>
    {
        const hash = crypto.createHash('sha256')
        .update(`${result.MarketCurrency}:${result.Created}`)
        .digest('hex');

        feed.item(
        {
            title: `${result.MarketCurrency} is now available on Bittrex`,
            description: `${result.MarketCurrency} is now available on Bittrex.`,
            url: `https://bittrex.com/Market/Index?MarketName=${result.BaseCurrency}-${result.MarketCurrency}`,
            guid: hash,
            date: new Date(result.Created)
        });
    });

    const xml = feed.xml();
    fs.writeFile('./feed.rss', xml, () => process.exit());
}

main();
