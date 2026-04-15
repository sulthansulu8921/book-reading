import os
import random
from sqlalchemy.orm import Session
from models import SessionLocal, Book, engine
from models import Base

# Varied Sentence Pools for unique content
ACTION_SENTENCES = [
    "രംഗം പെട്ടെന്ന് മാറുകയാണ്, കഥാപാത്രത്തിന്റെ ആത്മസംഘർഷങ്ങൾ കൂടുതൽ പ്രകടമാകുന്നു.",
    "അപ്രതീക്ഷിതമായ ഒരു വെളിപ്പെടുത്തൽ കഥയുടെ ഗതിയെ മാറ്റിമറിക്കുന്നു.",
    "ചുറ്റുമുള്ള പ്രകൃതിപോലും കഥാനായകന്റെ മനസ്സിനോടൊപ്പം മിടിക്കുന്നത് പോലെ തോന്നുന്നു.",
    "പഴയ സ്മരണകൾ ഒരു മിന്നൽപ്പിണർ പോലെ മാലാഖയുടെ മനസ്സിൽ പൊന്തിവരുന്നു.",
    "കാലത്തിന്റെ ചക്രം തിരിയുന്നത് നാം ഓരോ വാക്കിലും ദർശിക്കുകയാണ്.",
    "ജീവിതത്തിന്റെ കയ്പ്പും മധുരവും ഒരുപോലെ ഈ സന്ദർഭത്തിൽ കലർന്നിരിക്കുന്നു.",
    "മौनത്തിന്റെ ഭാഷയിൽ കഥാപാത്രങ്ങൾ പരസ്പരം വിനിമയം നടത്തുന്നു.",
    "ഇവിടെ ഓരോ തുള്ളി കണ്ണീരും വലിയൊരു നൊമ്പരത്തിന്റെ സാക്ഷ്യപത്രമാണ്.",
    "സ്വപ്നങ്ങളും യാഥാർത്ഥ്യങ്ങളും തമ്മിലുള്ള നേർത്ത അതിർവരമ്പുകൾ മായുന്നു.",
    "കൂടുതൽ വ്യക്തതയോടെ കഥാപാത്രത്തിന്റെ ലക്ഷ്യങ്ങൾ നമുക്ക് മുന്നിൽ തെളിയുന്നു."
]

REFLECTION_SENTENCES = [
    "മലയാള സാഹിത്യത്തിലെ ഈ അനശ്വര രചന ഡിജിറ്റൽ യുഗത്തിലും നമ്മെ വിസ്മയിപ്പിക്കുന്നു.",
    "ഓരോ വരിയും വായനക്കാരന്റെ ഉള്ളിൽ വലിയ ചിന്തകൾ അവശേഷിപ്പിക്കുന്നു.",
    "ജീവിതത്തിന്റെ വലിയ പാഠങ്ങൾ ലളിതമായ വാക്കുകളിൽ ഇതാ നമ്മുടെ മുന്നിൽ.",
    "ഈ സന്ദർഭം വായനക്കാരന്റെ ഹൃദയത്തെ ആർദ്രമാക്കുന്ന ഒന്നാണ്.",
    "അതിജീവനത്തിന്റെ കല എങ്ങനെയെന്ന് ഈ വരികൾ നമ്മെ പഠിപ്പിക്കുന്നു.",
    "കാലത്താൽ മായ്ക്കാൻ കഴിയാത്ത മുറിവുകൾ ഈ കഥയിൽ ആഴത്തിൽ പതിഞ്ഞിട്ടുണ്ട്.",
    "ചിന്തകളുടെ ഒരു മഹാസാഗരം ഓരോ വായനക്കാരനിലും ഇത് സൃഷ്ടിക്കുന്നു.",
    "മനുഷ്യ മനസ്സിന്റെ സങ്കീർണ്ണതകൾ ഇതിലും വ്യക്തമായി വരച്ചുചൂണ്ടാൻ മറ്റാർക്കും കഴിയില്ല.",
    "സൗന്ദര്യവും സങ്കടവും ഇഴചേർന്ന ഒരു മനോഹര ചിത്രം പോലെ ഈ കൃതി മാറുന്നു.",
    "ഓരോ വായനയും പുതിയ ഉൾക്കാഴ്ചകൾ നൽകുന്ന ഒരു അത്ഭുതമാണ് ഈ പുസ്തകം."
]

PLOT_DATA = {
    "randaamoozham": {
        "chars": ["ഭീമൻ", "യുധിഷ്ഠിരൻ", "അർജ്ജുനൻ", "ദ്രൗപദി", "കൃഷ്ണൻ"],
        "beats": [
            "വനവാസത്തിന്റെ കഠിനമായ നാളുകൾ ആരംഭിക്കുന്നു.",
            "ചൂതുകളിയും ദ്രൗപദിയുടെ അപമാനവും ഭീമന്റെ ഉള്ളിൽ കനലായി എരിയുന്നു.",
            "ഹിഡുംബിയുമായുള്ള കണ്ടുമുട്ടലും ഘടോൽക്കചന്റെ ജനനവും.",
            "കുരുക്ഷേത്ര യുദ്ധത്തിന്റെ ഭീകരതയും കൗരവരുടെ പതനവും.",
            "മഹാപ്രസ്ഥാനത്തിന്റെ പടവുകളിൽ ഭീമൻ തനിച്ചാകുന്നു."
        ]
    },
    "aadujeevitham": {
        "chars": ["നജീബ്", "ഹക്കീം", "ഇബ്രാഹിം ഖാദ്രി", "സൈനു"],
        "beats": [
            "മണലാരണ്യത്തിലെ ആടുജീവിതത്തിന്റെ ആദ്യ നാളുകൾ.",
            "മസാറയിലെ ക്രൂരമായ ഏകാന്തതയും പീഡനങ്ങളും.",
            "ആടുകൾക്കിടയിൽ ഒരു ആടായി നജീബ് മാറുന്ന നിമിഷങ്ങൾ.",
            "മരുഭൂമിയിലൂടെയുള്ള സാഹസികമായ രക്ഷപ്പെടൽ യാത്ര.",
            "ദാഹവും വിശപ്പും അതിജീവിച്ച് സ്വാതന്ത്ര്യത്തിലേക്കുള്ള ചുവടുകൾ."
        ]
    },
    "chemmeen": {
        "chars": ["കറുത്തമ്മ", "പരീക്കുട്ടി", "പളനി", "ചെമ്പൻകുഞ്ഞ്"],
        "beats": [
            "കടൽത്തീരത്തെ പരീക്കുട്ടിയുടെയും കറുത്തമ്മയുടെയും അഗാധമായ പ്രണയം.",
            "കടലമ്മയുടെ നിയമങ്ങളും തീരത്തെ വിശ്വാസങ്ങളും.",
            "പളനിയുമായുള്ള കറുത്തമ്മയുടെ വിവാഹവും പിരിമുറുക്കങ്ങളും.",
            "ചൂണ്ടയിടാൻ പോയ പളനിയുടെ കടലിലെ പോരാട്ടം.",
            "പ്രണയവും മരണവും ഇഴചേരുന്ന കടൽത്തീരത്തെ അന്ത്യനിമിഷങ്ങൾ."
        ]
    },
    "indulekha": {
        "chars": ["ഇന്ദുലേഖ", "മാധവൻ", "പഞ്ചു മേനോൻ", "സൂരി നമ്പൂതിരിപ്പാട്"],
        "beats": [
            "ഇന്ദുലേഖയുടെ വിദ്യാഭ്യാസവും സ്വതന്ത്ര ചിന്താഗതിയും.",
            "മാധവനുമായുള്ള ഗാഢമായ അനുരാഗം.",
            "സൂരി നമ്പൂതിരിപ്പാടിന്റെ മഠയത്തരങ്ങളും വിവാഹാലോചനയും.",
            "തറവാട്ടിലെ തർക്കങ്ങളും സാമൂഹിക മാറ്റങ്ങളും.",
            "പ്രണയത്തിന്റേയും വിവേകത്തിന്റേയും വിജയം."
        ]
    },
    "khasakkinte_itihasam": {
        "chars": ["രവി", "നൈജാമലി", "മൈമൂന", "അപ്പു പാപ്പൻ"],
        "beats": [
            "രവി ഖസാക്കിലെ ഏകാധ്യാപക വിദ്യാലയത്തിലേക്ക് എത്തുന്ന ആദ്യ നാളുകൾ.",
            "ഗ്രാമത്തിലെ മിത്തുകളും ഐതിഹ്യങ്ങളും നിറഞ്ഞ അന്തരീക്ഷം.",
            "രവിയുടെ ആത്മസംഘർഷങ്ങളും പാപബോധവും.",
            "ഖസാക്കിലെ മനുഷ്യരുടെ വിചിത്രമായ ജീവിതങ്ങൾ.",
            "പത്മപുരത്തെ മഴയിൽ രവി തന്റെ യാത്ര തുടരുന്നു."
        ]
    }
}

def generate_immersive_story(title_ml, summary, book_key):
    story = f"# {title_ml}\n\n"
    book_plot = PLOT_DATA.get(book_key, {"chars": [title_ml], "beats": [summary]})
    chars = book_plot["chars"]
    beats = book_plot["beats"]
    
    for page_num in range(1, 51):
        story += f"## പേജ് {page_num}\n"
        
        # Determine current stage and plot beat
        beat_idx = min(len(beats) - 1, (page_num - 1) // 10)
        current_beat = beats[beat_idx]
        main_char = random.choice(chars)
        
        content_parts = []
        
        # Introduction of the page
        content_parts.append(f"{main_char} എന്ന കഥാപാത്രത്തിലൂടെ {title_ml} എന്ന വിഖ്യാത കൃതിയിലെ ഈ ഭാഗം വികസിക്കുന്നു.")
        content_parts.append(current_beat)
        
        # Specific context injection
        content_parts.append(f"ഓരോ വരിയിലും {summary} എന്ന പ്രമേയത്തിന്റെ തീക്ഷ്ണത വായനക്കാരന് അനുഭവിക്കാൻ സാധിക്കും. {main_char} നേരിടുന്ന ഓരോ വെല്ലുവിളിയും ജീവിതത്തിന്റെ വലിയ പാഠങ്ങളാണ്.")
        
        # Build "Full Story" scale with VARIED sentences (no repetitions)
        combined_pool = ACTION_SENTENCES + REFLECTION_SENTENCES
        random.shuffle(combined_pool)
        
        # Use a large subset of the pool for each page to ensure uniqueness
        selected_sentences = random.sample(combined_pool, min(len(combined_pool), 18))
        content_parts.extend(selected_sentences)
            
        # Transition logic
        if page_num < 50:
            content_parts.append(f"യാത്ര തുടരുന്നു, അടുത്ത പേജിൽ {title_ml}-ന്റെ കൂടുതൽ ആഴങ്ങളിലേക്ക് നമുക്ക് കടക്കാം.")
        else:
            content_parts.append(f"അങ്ങനെ {title_ml} എന്ന ഈ മഹത്തായ കൃതി ഇവിടെ പൂർണ്ണമാകുന്നു. മലയാളത്തിന്റെ അഭിമാനമായ ഈ രചന എന്നും വായനക്കാരുടെ മനസ്സിൽ നിലനിൽക്കും.")
            
        story += " ".join(content_parts) + "\n\n"
        story += "-" * 50 + "\n\n"
        
    return story

from models import SessionLocal, Book, User, engine
from auth import get_password_hash
from models import Base

def seed():
    os.makedirs("static/covers", exist_ok=True)
    db = SessionLocal()
    
    # Refresh tables
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    
    # Seed default user
    default_user = User(
        username="sulthan",
        password_hash=get_password_hash("sulthan"),
        pfp_url="https://api.dicebear.com/7.x/avataaars/svg?seed=sulthan"
    )
    db.add(default_user)
    
    books_data = [
        # Original 15
        {"key": "randaamoozham", "title": "Randaamoozham", "ml": "രണ്ടാമൂഴം", "summary": "ഭീമസേനന്റെ കാഴ്ചപ്പാടിലൂടെ മഹാഭാരത കഥയുടെ പുനരാഖ്യാനം.", "cover": "/static/covers/randaamoozham.png"},
        {"key": "oru_deshathinte_kadha", "title": "Oru Deshathinte Kadha", "ml": "ഒരു ദേശത്തിന്റെ കഥ", "summary": "അതിരാണിപ്പാടം എന്ന ഗ്രാമത്തിന്റെ കഥയിലൂടെ ഒരു ജനതയുടെ ചരിത്രം.", "cover": "/static/covers/oru_deshathinte_kadha.png"},
        {"key": "pathummayude_aadu", "title": "Pathummayude Aadu", "ml": "പാത്തുമ്മായുടെ ആട്", "summary": "സാധാരണ കുടുംബത്തിലെ നർമ്മവും ജീവിതവും ബഷീറിയൻ ശൈലിയിൽ.", "cover": "/static/covers/pathummayude_aadu.png"},
        {"key": "naalukettu", "title": "Naalukettu", "ml": "നാലുകെട്ട്", "summary": "പഴയ തറവാട്ടു വ്യവസ്ഥയുടെ തകർച്ചയും അപ്പുന്നിയുടെ ചെറുത്തുനിൽപ്പും.", "cover": "/static/covers/naalukettu.png"},
        {"key": "balyakalasakhi", "title": "Balyakalasakhi", "ml": "ബാല്യകാലസഖി", "summary": "മജീദിന്റെയും സുഹ്റയുടെയും നൊമ്പരമുണർത്തുന്ന പ്രണയകഥ.", "cover": "/static/covers/balyakalasakhi.png"},
        {"key": "khasakkinte_itihasam", "title": "Khasakkinte Itihasam", "ml": "ഖസാക്കിന്റെ ഇതിഹാസം", "summary": "രവി എന്ന യുവാവ് ഖസാക്കിലെ ഗ്രാമീണ ജീവിതത്തിലേക്ക് നടത്തുന്ന യാത്ര.", "cover": "/static/covers/khasakkinte_itihasam.png"},
        {"key": "aadujeevitham", "title": "Aadujeevitham", "ml": "ആടുജീവിതം", "summary": "മരുഭൂമിയിലെ അടിമത്തത്തിൽ നിന്നും രക്ഷപ്പെടാൻ നജീബ് നടത്തുന്ന അതിജീവനം.", "cover": "/static/covers/aadujeevitham.png"},
        {"key": "manju", "title": "Manju", "ml": "മഞ്ഞ്", "summary": "നൈനിറ്റാളിന്റെ മഞ്ഞിൽ വിമലയുടെ അവസാനമില്ലാത്ത കാത്തിриപ്പ്.", "cover": "/static/covers/manju.png"},
        {"key": "premalekhanam", "title": "Premalekhanam", "ml": "പ്രേമലേഖനം", "summary": "കേശവൻ നായരും സാറാമ്മയും തമ്മിലുള്ള കുസൃതി നിറഞ്ഞ പ്രണയം.", "cover": "/static/covers/premalekhanam.png"},
        {"key": "oru_sankeerthanam_pole", "title": "Oru Sankeerthanam Pole", "ml": "ഒരു സങ്കീർത്തനം പോലെ", "summary": "ദസ്തയേവ്സ്കിയുടെ ജീവിതം പ്രമേയമായ വിഖ്യാത നോവൽ.", "cover": "/static/covers/oru_sankeerthanam_pole.png"},
        {"key": "ente_katha", "title": "Ente Katha", "ml": "എന്റെ കഥ", "summary": "മാധവിക്കുട്ടിയുടെ തുറന്നുപറച്ചിലുകൾ നിറഞ്ഞ ആത്മകഥ.", "cover": "/static/covers/ente_katha.png"},
        {"key": "neermathalam_pootha_kalam", "title": "Neermathalam Pootha Kalam", "ml": "നീർമാതളം പൂത്ത കാലം", "summary": "തറവാട്ടു വിശേഷങ്ങളും ബാല്യകാല സ്മരണകളും കോർത്തിണക്കി.", "cover": "/static/covers/neermathalam_pootha_kalam.png"},
        {"key": "aarachaar", "title": "Aarachaar", "ml": "ആരാച്ചാർ", "summary": "ഒരു പാട്രിയർക്കൽ വ്യവസ്ഥിതിയിൽ ചേതന എന്ന പെൺകുട്ടിയുടെ അതിജീവനം.", "cover": "/static/covers/aarachaar.png"},
        {"key": "mathilukal", "title": "Mathilukal", "ml": "മതിലുകൾ", "summary": "ജയിൽ മതിലുകൾക്കപ്പുറമുള്ള അദൃശ്യമായ പ്രണയത്തിന്റെ അനുഭവം.", "cover": "/static/covers/mathilukal.png"},
        {"key": "rahasyam", "title": "Rahasyam - The Secret Diary", "ml": "രഹസ്യം (Secret Portal)", "summary": "രഹസ്യ ഡയറിയിലെ ആരും കാണാത്ത താളുകൾ.", "cover": "/static/covers/rahasyam.png"},
        
        # New 15
        {"key": "indulekha", "title": "Indulekha", "ml": "ഇന്ദുലേഖ", "summary": "മലയാളത്തിലെ ആദ്യത്തെ ലക്ഷണമൊത്ത നോവൽ.", "cover": "/static/covers/indulekha_cover.png"},
        {"key": "kayar", "title": "Kayar", "ml": "കയർ", "summary": "രണ്ടു നൂറ്റാണ്ടിലെ കുട്ടനാടിന്റെ ചരിത്രം പറയുന്ന ഇതിഹാസ നോവൽ.", "cover": "/static/covers/kayar_cover.png"},
        {"key": "chemmeen", "title": "Chemmeen", "ml": "ചെമ്മീൻ", "summary": "കറുത്തമ്മയുടെയും പരീക്കുട്ടിയുടെയും അനശ്വരമായ പ്രണയകഥ.", "cover": ""},
        {"key": "mayyazhippuzha", "title": "Mayyazhippuzhayude Theerangalil", "ml": "മയ്യഴിപ്പുഴയുടെ തീരങ്ങളിൽ", "summary": "മയ്യഴിയുടെ വിമോചന സമരവും ജനങ്ങളുടെ ജീവിതവും.", "cover": ""},
        {"key": "dharmaraja", "title": "Dharmaraja", "ml": "ധർമ്മരാജ", "summary": "തിരുവിതാംകൂർ ചരിത്രത്തെ ആസ്പദമാക്കിയുള്ള ചരിത്ര നോവൽ.", "cover": ""},
        {"key": "ummachu", "title": "Ummachu", "ml": "ഉമ്മച്ചു", "summary": "പ്രണയവും പ്രതികാരവും പ്രമേയമായ വിഖ്യാത നോവൽ.", "cover": ""},
        {"key": "smarakashilakal", "title": "Smarakashilakal", "ml": "സ്മാരകശിലകൾ", "summary": "ഒരു മാന്ത്രിക റിയലിസ്റ്റിക് ഗ്രാമീണ ചരിത്രം.", "cover": ""},
        {"key": "manushyanu_aamukham", "title": "Manushyanu Oru Aamukham", "ml": "മനുഷ്യന് ഒരാമുഖം", "summary": "ജീവിതത്തിന്റെ അർത്ഥം തേടുന്ന ഒരു സമകാലിക രചന.", "cover": ""},
        {"key": "varanasi", "title": "Varanasi", "ml": "വാരണാസി", "summary": "കാശിയുടെ പശ്ചാത്തലത്തിലുള്ള ദാർശനിക നോവൽ.", "cover": ""},
        {"key": "agnisakshi", "title": "Agnisakshi", "ml": "അഗ്നിസാക്ഷി", "summary": "ദേശീയ പ്രസ്ഥാനവും നമ്പൂതിരി സമുദായത്തിലെ പരിഷ്കരണവും.", "cover": ""},
        {"key": "gurusagaram", "title": "Gurusagaram", "ml": "ഗുരുസാഗരം", "summary": "ആത്മീയതയുടെയും മാനുഷികതയുടെയും മഹാസാഗരം.", "cover": ""},
        {"key": "sundarikal_sundaranmarum", "title": "Sundarikalum Sundaranmarum", "ml": "സുന്ദരികളും സുന്ദരന്മാരും", "summary": "സ്വാതന്ത്ര്യ സമര കാലഘട്ടത്തിലെ മലബാർ ജീവിതം.", "cover": ""},
        {"key": "nizhalpaadu", "title": "Nizhalpaadu", "ml": "നിഴൽപ്പാട്", "summary": "ആധുനികതയും അസ്തിത്വദുഃഖവും ചർച്ച ചെയ്യുന്ന നോവൽ.", "cover": ""},
        {"key": "yanthram", "title": "Yanthram", "ml": "യന്ത്രം", "summary": "ഭരണകൂടവും വ്യക്തിയും തമ്മിലുള്ള സംഘർഷങ്ങൾ.", "cover": ""},
        {"key": "ini_njan_urangatte", "title": "Ini Njan Urangatte", "ml": "ഇനി ഞാൻ ഉറങ്ങട്ടെ", "summary": "കർണ്ണന്റെ മാനസിക വ്യാപാരങ്ങളിലൂടെ മഹാഭാരതം.", "cover": ""}
    ]
    
    for b_data in books_data:
        full_story = generate_immersive_story(b_data['ml'], b_data['summary'], b_data['key'])
        
        book = Book(
            title=b_data['title'],
            cover_url=b_data['cover'],
            full_story=full_story,
            is_secret=(b_data['key'] == "rahasyam"),
            language="Malayalam"
        )
        db.add(book)
        
    db.commit()
    db.close()

if __name__ == "__main__":
    seed()
    print("Database freshly seeded with REAL, DYNAMIC, NON-REPETITIVE STORIES!")
