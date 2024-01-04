import axios from "axios";
import * as cheerio from "cheerio";
import { extractCurrency, extractDescription, extractPrice } from "../utils";

export async function scrapeAmazonProduct(url: string){
    if(!url) return;

    //BrightData proxy configuration
    const username = String(process.env.BRIGHT_DATA_USERNAME);
    const password = String(process.env.BRIGHT_DATA_PASSWORD);
    const port = 22225;
    const session_id = (1000000 * Math.random() | 0);

    const options = {
        auth:{
            username: `${username}-session-${session_id}`,
            password,
        },
        host: 'brb.superproxy.io',
        port,
        rejectUnautorized: false,
    }

    try {
        const response = await axios.get(url, options);
        const $ = cheerio.load(response.data)

        const title = $('#productTitle').text().trim();
        const currentPrice = extractPrice(
            $('.priceToPay span.a-price-whole'),
            $('.a.size.base.a-color-price'),
            $('.a-button-selected .a-color-base'),
            $('#price'),
            $('.slot-price'),
          );

          const originalPrice = extractPrice(
            $('#priceblock_ourprice'),
            $('.a-price.a-text-price span.a-offscreen'),
            $('#listPrice'),
            $('#priceblock_dealprice'),
            $('.a-size-base.a-color-price')
          );
      
          const outOfStock = 
          $('#availability span').text().trim().toLowerCase() === 'currently unavailable' ||
          $('#exports_desktop_outOfStock_buybox_message_feature_div > div > span').text().trim().toLowerCase() === 'temporarily out of stock.'
          
          const images = 
            $('#imgBlkFront').attr('data-a-dynamic-image') || 
            $('#landingImage').attr('data-a-dynamic-image') ||
            '{}'
      
          const imageUrls = Object.keys(JSON.parse(images));
      
          const currency = extractCurrency($('.a-price-symbol'))
          const discountRate = parseFloat($('#savingsPercentage, .savingPriceOverride:first').text().replace(/[^\d.]/g, '')) || 0;
      
          const description = extractDescription($)

          const reviewsCount = $('#acrCustomerReviewText:first').text().replace(/[^\d.]/g, '')
          const stars = parseFloat($('#acrPopover:first > span.a-declarative > a > span').text())

      
          // Construct data object with scraped information
          const data = {
            url,
            currency: currency || '$',
            image: imageUrls[0],
            title,
            currentPrice: Number(currentPrice) || Number(originalPrice),
            originalPrice: Number(originalPrice) || Number(currentPrice),
            priceHistory: [],
            discountRate: isNaN(discountRate) ? 0 : Number(discountRate),
            category: 'category',
            reviewsCount:Number(reviewsCount),
            stars: Number(stars),
            isOutOfStock: outOfStock,
            description: "Description",
            lowestPrice: Number(currentPrice) || Number(originalPrice),
            highestPrice: Number(originalPrice) || Number(currentPrice),
            averagePrice: Number(currentPrice) || Number(originalPrice),
          }
          return data;
          
    } catch (error: any) {
        throw new Error (`Failed to scrpe product: ${error.message}`)
    }
}