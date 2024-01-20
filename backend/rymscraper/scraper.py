from selenium import webdriver
from selenium.webdriver.firefox.options import Options
from selenium.webdriver.common.by import By
from bs4 import BeautifulSoup
import time

class Scraper:
    def __init__(self):
        options = Options()
        options.add_argument('-headless')
        self.driver = webdriver.Firefox(options=options)

    def __del__(self):
        self.driver.quit()

    def get_artist_url(self, artist):
        url = get_search_url(artist)
        try:
            self.driver.get(url)
            time.sleep(0.2)
            soup = BeautifulSoup(self.driver.page_source, 'html.parser')
            a = soup.find('a', class_='searchpage')
            path = a['href'] if a else None
            return "https://rateyourmusic.com" + path
        except:
            None

    def get_artist_soup(self, artist):
        url = self.get_artist_url(artist)
        try:
            self.driver.get(url)
            time.sleep(0.2)
            return BeautifulSoup(self.driver.page_source, 'html.parser')
        except:
            return None

    def get_artist_info(self, artist):
        try:
            soup = self.get_artist_soup(artist)
            try:
                show_more_button = self.driver.find_element(By.ID, 'disco_header_show_link_s')
                if show_more_button:
                    self.driver.execute_script("arguments[0].click();", show_more_button)
                    time.sleep(2)
                    soup = BeautifulSoup(self.driver.page_source, 'html.parser')
            except:
                None
            
            album_div = soup.find('div', id='disco_type_s')
            if album_div:
                albums = album_div.find_all('div', class_='disco_release')
                album_info_html = [
                    [a.find('a', class_='album'), 
                    a.find('div', class_='disco_avg_rating enough_data'), 
                    a.find('div', class_='disco_ratings')] for a in albums
                ]
                album_info = [
                    [(e.text.strip() if e and e.text is not None else None) for e in a]
                    for a in album_info_html
                ]
                genres = self.get_artist_genres(soup)
                return {'albums': album_info, 'genres': genres}
            else:
                return {}

        except Exception as e:
            return f"An error occurred: {e}"
        
    def get_artist_genres(self, soup):
        genres = soup.find_all('a', class_='genre')
        genres = [g.text.strip() for g in genres]
        return genres
    
def get_search_url(query):
    return "https://rateyourmusic.com/search?searchterm=" + ("+".join(query.split()))

def main():
    artist = input("Artist: ")
    scraper = Scraper()
    print(scraper.get_artist_info(artist))

if __name__ == "__main__":
    main()
