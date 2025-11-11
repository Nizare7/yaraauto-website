import tkinter as tk
from tkinter import ttk, messagebox, filedialog
import json
import os
import shutil
import random
from datetime import datetime
from pathlib import Path

class CarManagerApp:
    def __init__(self, root):
        self.root = root
        self.root.title("Gestore Auto - JSON Editor")
        self.root.geometry("900x700")
        
        # Usa il percorso assoluto basato sulla posizione dello script
        script_dir = Path(__file__).parent
        self.json_file = script_dir / "dataset.json"
        self.data = self.load_json()
        
        self.create_widgets()
        
    def load_json(self):
        try:
            with open(self.json_file, 'r', encoding='utf-8') as f:
                return json.load(f)
        except FileNotFoundError:
            messagebox.showerror("Errore", f"File {self.json_file} non trovato!")
            return {"brands": []}
    
    def save_json(self):
        with open(self.json_file, 'w', encoding='utf-8') as f:
            json.dump(self.data, f, ensure_ascii=False, indent=2)
        messagebox.showinfo("Successo", "Dati salvati con successo!")
    
    def create_widgets(self):
        # Notebook per tab
        notebook = ttk.Notebook(self.root)
        notebook.pack(fill='both', expand=True, padx=10, pady=10)
        
        # Tab Aggiungi Auto
        add_frame = ttk.Frame(notebook)
        notebook.add(add_frame, text="Aggiungi Auto")
        self.create_add_tab(add_frame)
        
        # Tab Rimuovi Auto
        remove_frame = ttk.Frame(notebook)
        notebook.add(remove_frame, text="Rimuovi Auto")
        self.create_remove_tab(remove_frame)
    
    def create_add_tab(self, parent):
        # Frame principale con scrollbar
        canvas = tk.Canvas(parent)
        scrollbar = ttk.Scrollbar(parent, orient="vertical", command=canvas.yview)
        scrollable_frame = ttk.Frame(canvas)
        
        scrollable_frame.bind(
            "<Configure>",
            lambda e: canvas.configure(scrollregion=canvas.bbox("all"))
        )
        
        canvas.create_window((0, 0), window=scrollable_frame, anchor="nw")
        canvas.configure(yscrollcommand=scrollbar.set)
        
        # Brand selection con filtro
        ttk.Label(scrollable_frame, text="Brand:", font=('Arial', 10, 'bold')).grid(row=0, column=0, sticky='w', padx=5, pady=5)
        
        brand_frame = ttk.Frame(scrollable_frame)
        brand_frame.grid(row=0, column=1, sticky='ew', padx=5, pady=5)
        
        self.brand_var = tk.StringVar()
        self.brand_search = ttk.Entry(brand_frame, textvariable=self.brand_var)
        self.brand_search.pack(fill='x')
        self.brand_search.bind('<KeyRelease>', self.filter_brands)
        
        self.brand_listbox = tk.Listbox(brand_frame, height=5)
        self.brand_listbox.pack(fill='both', expand=True)
        self.populate_brands()
        
        # Campi input
        fields = [
            ("Nome Auto:", "name", "string"),
            ("Chilometraggio:", "chilometraggio", "int"),
            ("Anno (YYYY):", "anno", "int"),
            ("Cilindrata:", "cilindrata", "int"),
            ("Cavalli:", "cavalli", "int"),
            ("KW:", "kw", "int"),
            ("Posti:", "posti", "int"),
            ("Prezzo:", "prezzo", "double"),
        ]
        
        self.entries = {}
        row = 1
        
        for label, key, _ in fields:
            ttk.Label(scrollable_frame, text=label).grid(row=row, column=0, sticky='w', padx=5, pady=5)
            entry = ttk.Entry(scrollable_frame, width=30)
            entry.grid(row=row, column=1, sticky='ew', padx=5, pady=5)
            self.entries[key] = entry
            row += 1
        
        # Dropdown per condizioni
        ttk.Label(scrollable_frame, text="Condizioni:").grid(row=row, column=0, sticky='w', padx=5, pady=5)
        self.condizioni_var = tk.StringVar()
        condizioni_combo = ttk.Combobox(scrollable_frame, textvariable=self.condizioni_var, width=28)
        condizioni_combo['values'] = ("Usato", "Nuovo", "Usato Ricondizionato", "Buono", "Ottimo", "Eccellente", "Usato Nuovo")
        condizioni_combo.grid(row=row, column=1, sticky='ew', padx=5, pady=5)
        row += 1
        
        # Dropdown per carburante
        ttk.Label(scrollable_frame, text="Carburante:").grid(row=row, column=0, sticky='w', padx=5, pady=5)
        self.carburante_var = tk.StringVar()
        carburante_combo = ttk.Combobox(scrollable_frame, textvariable=self.carburante_var, width=28)
        carburante_combo['values'] = (
            "Benzina", "Diesel", "GPL", "Mild Hybrid Benzina+Elettrico leggero",
            "Full Hybrid (HEV) Benzina+Elettrico", "Plug-in Hybrid (PHEV) Benzina+Elettrico con batteria grande",
            "Plug-in Hybrid (PHEV) Gasolio+Elettrico con batteria grande", "Benzina-GPL",
            "Benzina-Elettrico-GPL", "Elettrica", "Ibrida"
        )
        carburante_combo.grid(row=row, column=1, sticky='ew', padx=5, pady=5)
        row += 1
        
        # Dropdown per tipo cambio
        ttk.Label(scrollable_frame, text="Tipo Cambio:").grid(row=row, column=0, sticky='w', padx=5, pady=5)
        self.cambio_var = tk.StringVar()
        cambio_combo = ttk.Combobox(scrollable_frame, textvariable=self.cambio_var, width=28)
        cambio_combo['values'] = ("Manuale", "Automatico")
        cambio_combo.grid(row=row, column=1, sticky='ew', padx=5, pady=5)
        row += 1
        
        # Dropdown per euro
        ttk.Label(scrollable_frame, text="Euro:").grid(row=row, column=0, sticky='w', padx=5, pady=5)
        self.euro_var = tk.StringVar()
        euro_combo = ttk.Combobox(scrollable_frame, textvariable=self.euro_var, width=28)
        euro_combo['values'] = ("Euro 0", "Euro 1", "Euro 2", "Euro 3", "Euro 4", "Euro 5", "Euro 6", "Euro 6A", "Euro 6B", "Euro 6C", "Euro 6D", "Euro 7")
        euro_combo.grid(row=row, column=1, sticky='ew', padx=5, pady=5)
        row += 1
        
        # Dropdown per neopatentati
        ttk.Label(scrollable_frame, text="Neopatentati:").grid(row=row, column=0, sticky='w', padx=5, pady=5)
        self.neopatentati_var = tk.StringVar()
        neopatentati_combo = ttk.Combobox(scrollable_frame, textvariable=self.neopatentati_var, width=28)
        neopatentati_combo['values'] = ("SI", "NO")
        neopatentati_combo.grid(row=row, column=1, sticky='ew', padx=5, pady=5)
        row += 1
        
        # Checkbox per venduto
        self.venduto_var = tk.BooleanVar()
        ttk.Checkbutton(scrollable_frame, text="Venduto", variable=self.venduto_var).grid(row=row, column=0, columnspan=2, sticky='w', padx=5, pady=5)
        row += 1
        
        # Checkbox per aggiunto
        self.aggiunto_var = tk.BooleanVar()
        ttk.Checkbutton(scrollable_frame, text="Aggiunto", variable=self.aggiunto_var).grid(row=row, column=0, columnspan=2, sticky='w', padx=5, pady=5)
        row += 1
        
        # Immagine principale
        ttk.Label(scrollable_frame, text="Immagine Principale:", font=('Arial', 10, 'bold')).grid(row=row, column=0, sticky='w', padx=5, pady=5)
        self.main_image_path = tk.StringVar()
        ttk.Entry(scrollable_frame, textvariable=self.main_image_path, width=30, state='readonly').grid(row=row, column=1, sticky='ew', padx=5, pady=5)
        ttk.Button(scrollable_frame, text="Seleziona", command=lambda: self.select_image('main')).grid(row=row, column=2, padx=5, pady=5)
        row += 1
        
        # Galleria immagini
        ttk.Label(scrollable_frame, text="Galleria:", font=('Arial', 10, 'bold')).grid(row=row, column=0, sticky='w', padx=5, pady=5)
        self.gallery_paths = []
        ttk.Button(scrollable_frame, text="Aggiungi Immagini", command=self.select_gallery_images).grid(row=row, column=1, sticky='w', padx=5, pady=5)
        row += 1
        
        self.gallery_listbox = tk.Listbox(scrollable_frame, height=5)
        self.gallery_listbox.grid(row=row, column=0, columnspan=3, sticky='ew', padx=5, pady=5)
        row += 1
        
        # Bottone aggiungi
        ttk.Button(scrollable_frame, text="Aggiungi Auto", command=self.add_car).grid(row=row, column=0, columnspan=3, pady=20)
        
        canvas.pack(side="left", fill="both", expand=True)
        scrollbar.pack(side="right", fill="y")
    
    def create_remove_tab(self, parent):
        # Frame per selezione brand
        ttk.Label(parent, text="Seleziona Brand:", font=('Arial', 10, 'bold')).pack(padx=10, pady=5)
        
        self.remove_brand_var = tk.StringVar()
        remove_brand_combo = ttk.Combobox(parent, textvariable=self.remove_brand_var, width=40)
        remove_brand_combo['values'] = [b['name'] for b in self.data['brands']]
        remove_brand_combo.pack(padx=10, pady=5)
        remove_brand_combo.bind('<<ComboboxSelected>>', self.load_cars_for_removal)
        
        # Listbox per auto
        ttk.Label(parent, text="Auto disponibili:", font=('Arial', 10, 'bold')).pack(padx=10, pady=5)
        
        self.cars_listbox = tk.Listbox(parent, height=15, width=80)
        self.cars_listbox.pack(padx=10, pady=5, fill='both', expand=True)
        
        # Bottone rimuovi
        ttk.Button(parent, text="Rimuovi Auto Selezionata", command=self.remove_car).pack(pady=10)
    
    def populate_brands(self):
        self.brand_listbox.delete(0, tk.END)
        for brand in self.data['brands']:
            self.brand_listbox.insert(tk.END, brand['name'])
    
    def filter_brands(self, event):
        search_term = self.brand_var.get().lower()
        self.brand_listbox.delete(0, tk.END)
        for brand in self.data['brands']:
            if search_term in brand['name'].lower():
                self.brand_listbox.insert(tk.END, brand['name'])
    
    def select_image(self, img_type):
        file_path = filedialog.askopenfilename(
            title="Seleziona immagine",
            filetypes=[("Immagini", "*.jpg *.jpeg *.png *.gif")]
        )
        if file_path:
            if img_type == 'main':
                self.main_image_path.set(file_path)
    
    def select_gallery_images(self):
        file_paths = filedialog.askopenfilenames(
            title="Seleziona immagini per la galleria",
            filetypes=[("Immagini", "*.jpg *.jpeg *.png *.gif")]
        )
        if file_paths:
            self.gallery_paths.extend(file_paths)
            self.gallery_listbox.delete(0, tk.END)
            for path in self.gallery_paths:
                self.gallery_listbox.insert(tk.END, os.path.basename(path))
    
    def generate_car_id(self, brand_id, car_name, chilometraggio, anno):
        # Estrai 3 lettere dal nome
        name_clean = car_name.lower().replace(" ", "")
        consonants = [c for c in name_clean if c.isalpha() and c not in 'aeiou']
        
        if len(name_clean) == 3:
            xxx = name_clean[:3]
        elif len(consonants) >= 3:
            xxx = ''.join(consonants[:3])
        elif len(consonants) == 2:
            # Trova una lettera vicina
            idx = name_clean.index(consonants[1])
            if idx + 1 < len(name_clean):
                xxx = consonants[0] + consonants[1] + name_clean[idx + 1]
            else:
                xxx = consonants[0] + consonants[1] + name_clean[0]
        elif len(consonants) == 1:
            idx = name_clean.index(consonants[0])
            if idx + 2 < len(name_clean):
                xxx = consonants[0] + name_clean[idx + 1] + name_clean[idx + 2]
            else:
                xxx = name_clean[:3]
        else:
            xxx = name_clean[:3]
        
        # ID numerico
        now = datetime.now()
        if chilometraggio < 1000:
            a = 1000 - chilometraggio
            num_digits = len(str(a))
            min_val = 10 ** (num_digits - 1)
            max_val = 10 ** num_digits - 1
            a = a * (10 ** num_digits) + random.randint(min_val, max_val)
        else :
            a = chilometraggio
        while a > 9999:
            last_digit = a % 10
            a = a // 10
            a += last_digit
        a = anno * 10 + a
        
        id_numerico = str(a) + now.strftime("%m%y")
        
        return f"{brand_id}-{xxx}{id_numerico}"
    
    
    def add_car(self):
        try:
            # Valida selezione brand
            selection = self.brand_listbox.curselection()
            if not selection:
                messagebox.showerror("Errore", "Seleziona un brand!")
                return
            
            brand_name = self.brand_listbox.get(selection[0])
            brand = next((b for b in self.data['brands'] if b['name'] == brand_name), None)
            
            # Raccogli dati
            car_data = {
                "brand": brand['name'],
                "name": self.entries['name'].get(),
                "chilometraggio": int(self.entries['chilometraggio'].get()),
                "condizioni": self.condizioni_var.get(),
                "anno": int(self.entries['anno'].get()),
                "carburante": self.carburante_var.get(),
                "cilindrata": int(self.entries['cilindrata'].get()),
                "cavalli": int(self.entries['cavalli'].get()),
                "kw": int(self.entries['kw'].get()),
                "tipo_cambio": self.cambio_var.get(),
                "euro": self.euro_var.get(),
                "posti": int(self.entries['posti'].get()),
                "prezzo": float(self.entries['prezzo'].get()),
                "neopatentati": self.neopatentati_var.get(),
                "venduto": self.venduto_var.get(),
                "aggiunto": self.aggiunto_var.get()
            }
            
            # Genera ID
            car_id = self.generate_car_id(
                brand['id'], 
                car_data['name'], 
                car_data['chilometraggio'], 
                car_data['anno']
            )
            car_data['id'] = car_id
            
            # Crea cartella e copia immagini
            id_numerico = car_id.split('-')[1][3:]  # Estrae parte numerica
            script_dir = Path(__file__).parent
            cars_base_path = script_dir.parent / "cars"  # g:\YaraAuto_website\yaraauto-website\cars
            folder_name = f"{car_data['name'].lower().replace(' ', '')}-{id_numerico}"
            folder_path = cars_base_path / brand['id'] / folder_name
            folder_path.mkdir(parents=True, exist_ok=True)
            
            # Percorso relativo base per il JSON (relativo alla root del sito)
            relative_base = f"../cars/{brand['id']}/{folder_name}"
            
            # Copia immagine principale
            if self.main_image_path.get():
                main_img_ext = os.path.splitext(self.main_image_path.get())[1]
                main_img_dest = folder_path / f"main{main_img_ext}"
                shutil.copy2(self.main_image_path.get(), str(main_img_dest))
                # Salva percorso relativo nel JSON
                car_data['image'] = f"{relative_base}/main{main_img_ext}"
            
            # Copia galleria
            gallery = []
            if self.main_image_path.get():
                gallery.append(f"{relative_base}/main{main_img_ext}")
            
            for i, img_path in enumerate(self.gallery_paths[1:] if self.main_image_path.get() in self.gallery_paths else self.gallery_paths, 1):
                img_ext = os.path.splitext(img_path)[1]
                img_dest = folder_path / f"main{i}{img_ext}"
                shutil.copy2(img_path, str(img_dest))
                # Salva percorso relativo nel JSON
                gallery.append(f"{relative_base}/main{i}{img_ext}")
            
            car_data['gallery'] = gallery
            
            # Aggiungi al JSON
            brand['cars'].append(car_data)
            self.save_json()
            
            messagebox.showinfo("Successo", f"Auto aggiunta con ID: {car_id}")
            self.clear_form()
            
        except Exception as e:
            messagebox.showerror("Errore", f"Errore durante l'aggiunta: {str(e)}")
    
    def clear_form(self):
        for entry in self.entries.values():
            entry.delete(0, tk.END)
        self.condizioni_var.set("")
        self.carburante_var.set("")
        self.cambio_var.set("")
        self.euro_var.set("")
        self.neopatentati_var.set("")
        self.venduto_var.set(False)
        self.aggiunto_var.set(False)
        self.main_image_path.set("")
        self.gallery_paths = []
        self.gallery_listbox.delete(0, tk.END)
    
    def load_cars_for_removal(self, event):
        self.cars_listbox.delete(0, tk.END)
        brand_name = self.remove_brand_var.get()
        brand = next((b for b in self.data['brands'] if b['name'] == brand_name), None)
        
        if brand:
            for car in brand['cars']:
                display_text = f"{car['name']} - {car['anno']} - {car['chilometraggio']}km - €{car['prezzo']}"
                self.cars_listbox.insert(tk.END, display_text)
    
    def remove_car(self):
        selection = self.cars_listbox.curselection()
        if not selection:
            messagebox.showerror("Errore", "Seleziona un'auto da rimuovere!")
            return
        
        brand_name = self.remove_brand_var.get()
        brand = next((b for b in self.data['brands'] if b['name'] == brand_name), None)
        
        if brand:
            car_index = selection[0]
            car = brand['cars'][car_index]
            
            # Conferma
            if messagebox.askyesno("Conferma", f"Vuoi rimuovere {car['name']}?"):
                # Rimuovi cartella immagini (opzionale)
                # folder_path = os.path.dirname(car['image'])
                # if os.path.exists(folder_path):
                #     shutil.rmtree(folder_path)
                
                brand['cars'].pop(car_index)
                self.save_json()
                self.load_cars_for_removal(None)
                messagebox.showinfo("Successo", "Auto rimossa con successo!")

if __name__ == "__main__":
    root = tk.Tk()
    app = CarManagerApp(root)
    root.mainloop()