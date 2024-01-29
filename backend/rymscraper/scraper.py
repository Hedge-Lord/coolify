import os
from selenium import webdriver
from selenium.webdriver.firefox.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import NoSuchElementException
from bs4 import BeautifulSoup
import time

class Scraper:
    def __init__(self):
        firefox_bin = os.environ.get('FIREFOX_BIN') or '/usr/local/bin/firefox'
        geckodriver_path = os.environ.get('GECKODRIVER_PATH') or '/usr/local/bin/geckodriver'
        options = Options()
        options.binary_location = firefox_bin
        options.add_argument('-headless')
        self.driver = webdriver.Firefox(executable_path=geckodriver_path, options=options)

    def __del__(self):
        self.driver.quit()

    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        self.driver.quit()

    def get_artist_url(self, artist):
        """Get the URL of the artist's page."""
        url = get_search_url(artist)
        try:
            self.driver.get(url)
            WebDriverWait(self.driver, 10).until(
                EC.visibility_of_element_located((By.CLASS_NAME, "searchpage")) 
            )
            time.sleep(0.2)
            soup = BeautifulSoup(self.driver.page_source, 'html.parser')
            link = soup.find('a', class_='searchpage')
            if link:
                return "https://rateyourmusic.com" + link['href']
        except Exception as e:
            print(f"Error getting artist URL: {e}")
            return None
        except:
            return None


    def get_artist_soup(self, artist):
        """Retrieve the BeautifulSoup object for an artist's page."""
        url = self.get_artist_url(artist)
        if url:
            try:
                self.driver.get(url)
                WebDriverWait(self.driver, 10).until(
                    EC.presence_of_element_located((By.ID, "discography")) 
                )
                time.sleep(0.2)
                return BeautifulSoup(self.driver.page_source, 'html.parser')
            except Exception as e:
                print(f"Error getting artist soup: {e}")
                return None
            except:
                return None

    def get_artist_info(self, artist):
        try:
            soup = self.get_artist_soup(artist)
            # if soup:
            #     try:
            #         show_more_button = self.driver.find_element(By.ID, 'disco_header_show_link_s')
            #         if show_more_button:
            #             self.driver.execute_script("arguments[0].click();", show_more_button)
            #             WebDriverWait(self.driver, 2).until(
            #                 EC.visibility_of_element_located((By.ID, 'disco_type_s'))
            #             )
            #             soup = BeautifulSoup(self.driver.page_source, 'html.parser')
            #     except NoSuchElementException:
            #         print("Show more button not found. Continuing without it.")
            #     except Exception as e:
            #         print(f"Error clicking show more button: {e}")
            
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
                country = self.get_artist_country(soup)
                return {'albums': album_info, 'genres': genres, 'country': country}
            else:
                return None

        except Exception as e:
            return None 
        except:
            return None
        
    def get_artist_genres(self, soup):
        genres = soup.find_all('a', class_='genre')
        genres = [g.text.strip() for g in genres]
        return genres
    
    def get_artist_country(self, soup):
        try:
            countries = soup.find_all('a', class_='location')
            if not countries:
                return None
            country = countries[0].text.strip().split(',')[-1].strip()
            return country
        except NoSuchElementException:
            return None
        except:
            return None
    
def get_search_url(query):
    return "https://rateyourmusic.com/search?searchterm=" + ("+".join(query.split()))

def main():
    artist = input("Artist: ")
    scraper = Scraper()
    print(scraper.get_artist_info(artist))

if __name__ == "__main__":
    main()
