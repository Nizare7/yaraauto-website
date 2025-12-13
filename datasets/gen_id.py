import tkinter as tk
from tkinter import ttk, messagebox, filedialog
import json
import os
import shutil
import random
from datetime import datetime
from pathlib import Path
from PIL import Image

class CarManagerApp:
    def __init__(self, root):
        self.root = root
        self.root.title("Gestore Auto - JSON Editor")
        self.root.geometry("900x700")
        
        # TODO SE VOGLIO TOGLIERE LE IMMAGINI DOPO LA RIMOZIONE DELLA MACCHINA
        # FLAG: Impostare a True per eliminare le cartelle delle immagini, False per conservarle
        self.DELETE_IMAGE_FOLDERS = True
        
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
    
    def update_last_update_file(self):
        """Aggiorna il file last_update.txt con data e ora correnti"""
        try:
            script_dir = Path(__file__).parent
            last_update_file = script_dir / "last_update.txt"
            
            now = datetime.now()
            timestamp = now.strftime("%d-%m-%Y %H:%M:%S")
            
            with open(last_update_file, 'w', encoding='utf-8') as f:
                f.write(timestamp)
                
        except Exception as e:
            print(f"Errore nell'aggiornamento di last_update.txt: {str(e)}")
    
    def save_json(self):
        with open(self.json_file, 'w', encoding='utf-8') as f:
            json.dump(self.data, f, ensure_ascii=False, indent=2)
        
        # Aggiorna il file last_update.txt
        self.update_last_update_file()
        
        messagebox.showinfo("Successo", "Dati salvati con successo!")
    
    def create_widgets(self):
        # Notebook per tab
        notebook = ttk.Notebook(self.root)
        notebook.pack(fill='both', expand=True, padx=10, pady=10)
        
        # Tab Aggiungi Auto
        add_frame = ttk.Frame(notebook)
        notebook.add(add_frame, text="Aggiungi Auto")
        self.create_add_tab(add_frame)
        
        # Tab Modifica Auto
        edit_frame = ttk.Frame(notebook)
        notebook.add(edit_frame, text="Modifica Auto")
        self.create_edit_tab(edit_frame)
        
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
        
        # Abilita scroll con rotellina del mouse e touchpad
        def _on_mousewheel(event):
            canvas.yview_scroll(int(-1*(event.delta/120)), "units")
        
        def _on_mousewheel_linux(event):
            if event.num == 4:
                canvas.yview_scroll(-1, "units")
            elif event.num == 5:
                canvas.yview_scroll(1, "units")
        
        def _bind_mousewheel(event):
            canvas.bind_all("<MouseWheel>", _on_mousewheel)
            canvas.bind_all("<Button-4>", _on_mousewheel_linux)
            canvas.bind_all("<Button-5>", _on_mousewheel_linux)
        
        def _unbind_mousewheel(event):
            canvas.unbind_all("<MouseWheel>")
            canvas.unbind_all("<Button-4>")
            canvas.unbind_all("<Button-5>")
        
        canvas.bind('<Enter>', _bind_mousewheel)
        canvas.bind('<Leave>', _unbind_mousewheel)
        
        # Campi input
        fields = [
            ("Nome Auto:", "name", "string"),
            ("Sotto Nome:", "sub_name", "string"),
            ("Dettagli:", "details", "string"),
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
        
        # Brand selection con filtro (spostato qui, prima del bottone)
        ttk.Label(scrollable_frame, text="Brand:", font=('Arial', 10, 'bold')).grid(row=row, column=0, sticky='w', padx=5, pady=5)
        
        brand_frame = ttk.Frame(scrollable_frame)
        brand_frame.grid(row=row, column=1, sticky='ew', padx=5, pady=5)
        
        self.brand_var = tk.StringVar()
        self.brand_search = ttk.Entry(brand_frame, textvariable=self.brand_var)
        self.brand_search.pack(fill='x')
        self.brand_search.bind('<KeyRelease>', self.filter_brands)
        
        self.brand_listbox = tk.Listbox(brand_frame, height=5)
        self.brand_listbox.pack(fill='both', expand=True)
        self.populate_brands()
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
        # Frame per barra di ricerca e bottone refresh
        search_frame = ttk.Frame(parent)
        search_frame.pack(padx=10, pady=5, fill='x')
        
        ttk.Label(search_frame, text="Cerca Auto:", font=('Arial', 10, 'bold')).pack(side='left', padx=(0, 5))
        
        self.remove_search_var = tk.StringVar()
        self.remove_search_entry = ttk.Entry(search_frame, textvariable=self.remove_search_var, width=50)
        self.remove_search_entry.pack(side='left', padx=5, fill='x', expand=True)
        self.remove_search_entry.bind('<KeyRelease>', self.filter_cars_for_removal)
        
        ttk.Button(search_frame, text="🔄 Aggiorna Lista", command=self.refresh_remove_list).pack(side='left', padx=5)
        
        # Listbox per auto
        ttk.Label(parent, text="Auto disponibili:", font=('Arial', 10, 'bold')).pack(padx=10, pady=5)
        
        self.cars_listbox = tk.Listbox(parent, height=15, width=80)
        self.cars_listbox.pack(padx=10, pady=5, fill='both', expand=True)
        
        # Popola lista iniziale con tutte le auto
        self.populate_cars_for_removal()
        
        # Bottone rimuovi
        ttk.Button(parent, text="Rimuovi Auto Selezionata", command=self.remove_car).pack(pady=10)
    
    def create_edit_tab(self, parent):
        # Frame principale diviso in due: lista auto a sinistra, form modifica a destra
        main_container = ttk.Frame(parent)
        main_container.pack(fill='both', expand=True, padx=10, pady=10)
        
        # SEZIONE SINISTRA: Ricerca e lista auto
        left_frame = ttk.Frame(main_container)
        left_frame.pack(side='left', fill='both', expand=False, padx=(0, 10))
        
        # Frame per barra di ricerca e bottone refresh
        search_frame = ttk.Frame(left_frame)
        search_frame.pack(padx=5, pady=5, fill='x')
        
        ttk.Label(search_frame, text="Cerca Auto:", font=('Arial', 10, 'bold')).pack(anchor='w')
        
        search_input_frame = ttk.Frame(search_frame)
        search_input_frame.pack(fill='x', pady=(5, 0))
        
        self.edit_search_var = tk.StringVar()
        self.edit_search_entry = ttk.Entry(search_input_frame, textvariable=self.edit_search_var)
        self.edit_search_entry.pack(side='left', fill='x', expand=True)
        self.edit_search_entry.bind('<KeyRelease>', self.filter_cars_for_edit)
        
        ttk.Button(search_input_frame, text="🔄", command=self.refresh_edit_list, width=3).pack(side='left', padx=(5, 0))
        
        # Listbox per auto
        ttk.Label(left_frame, text="Seleziona Auto:", font=('Arial', 10, 'bold')).pack(padx=5, pady=5)
        
        # Frame con scrollbar per listbox
        listbox_frame = ttk.Frame(left_frame)
        listbox_frame.pack(padx=5, pady=5, fill='both', expand=True)
        
        scrollbar = ttk.Scrollbar(listbox_frame)
        scrollbar.pack(side='right', fill='y')
        
        self.edit_cars_listbox = tk.Listbox(listbox_frame, height=20, width=50, yscrollcommand=scrollbar.set)
        self.edit_cars_listbox.pack(side='left', fill='both', expand=True)
        scrollbar.config(command=self.edit_cars_listbox.yview)
        
        # Bind selezione
        self.edit_cars_listbox.bind('<<ListboxSelect>>', self.load_car_for_edit)
        
        # Popola lista iniziale
        self.populate_cars_for_edit()
        
        # SEZIONE DESTRA: Form di modifica (con scrollbar)
        right_frame = ttk.Frame(main_container)
        right_frame.pack(side='right', fill='both', expand=True)
        
        # Canvas con scrollbar per il form
        canvas = tk.Canvas(right_frame)
        scrollbar_right = ttk.Scrollbar(right_frame, orient="vertical", command=canvas.yview)
        scrollable_frame = ttk.Frame(canvas)
        
        scrollable_frame.bind(
            "<Configure>",
            lambda e: canvas.configure(scrollregion=canvas.bbox("all"))
        )
        
        canvas.create_window((0, 0), window=scrollable_frame, anchor="nw")
        canvas.configure(yscrollcommand=scrollbar_right.set)
        
        # Abilita scroll con rotellina del mouse e touchpad
        def _on_mousewheel_edit(event):
            canvas.yview_scroll(int(-1*(event.delta/120)), "units")
        
        def _on_mousewheel_linux_edit(event):
            if event.num == 4:
                canvas.yview_scroll(-1, "units")
            elif event.num == 5:
                canvas.yview_scroll(1, "units")
        
        def _bind_mousewheel_edit(event):
            canvas.bind_all("<MouseWheel>", _on_mousewheel_edit)
            canvas.bind_all("<Button-4>", _on_mousewheel_linux_edit)
            canvas.bind_all("<Button-5>", _on_mousewheel_linux_edit)
        
        def _unbind_mousewheel_edit(event):
            canvas.unbind_all("<MouseWheel>")
            canvas.unbind_all("<Button-4>")
            canvas.unbind_all("<Button-5>")
        
        canvas.bind('<Enter>', _bind_mousewheel_edit)
        canvas.bind('<Leave>', _unbind_mousewheel_edit)
        
        # Titolo form
        ttk.Label(scrollable_frame, text="Modifica Auto Selezionata", font=('Arial', 12, 'bold')).grid(row=0, column=0, columnspan=3, pady=10)
        
        # Campi input (stessi di aggiungi auto)
        fields = [
            ("Nome Auto:", "edit_name", "string"),
            ("Sotto Nome:", "edit_sub_name", "string"),
            ("Dettagli:", "edit_details", "string"),
            ("Chilometraggio:", "edit_chilometraggio", "int"),
            ("Anno (YYYY):", "edit_anno", "int"),
            ("Cilindrata:", "edit_cilindrata", "int"),
            ("Cavalli:", "edit_cavalli", "int"),
            ("KW:", "edit_kw", "int"),
            ("Posti:", "edit_posti", "int"),
            ("Prezzo:", "edit_prezzo", "double"),
        ]
        
        self.edit_entries = {}
        row = 1
        
        for label, key, _ in fields:
            ttk.Label(scrollable_frame, text=label).grid(row=row, column=0, sticky='w', padx=5, pady=5)
            entry = ttk.Entry(scrollable_frame, width=30)
            entry.grid(row=row, column=1, sticky='ew', padx=5, pady=5)
            self.edit_entries[key] = entry
            row += 1
        
        # Dropdown per condizioni
        ttk.Label(scrollable_frame, text="Condizioni:").grid(row=row, column=0, sticky='w', padx=5, pady=5)
        self.edit_condizioni_var = tk.StringVar()
        edit_condizioni_combo = ttk.Combobox(scrollable_frame, textvariable=self.edit_condizioni_var, width=28)
        edit_condizioni_combo['values'] = ("Usato", "Nuovo", "Usato Ricondizionato", "Buono", "Ottimo", "Eccellente", "Usato Nuovo")
        edit_condizioni_combo.grid(row=row, column=1, sticky='ew', padx=5, pady=5)
        row += 1
        
        # Dropdown per carburante
        ttk.Label(scrollable_frame, text="Carburante:").grid(row=row, column=0, sticky='w', padx=5, pady=5)
        self.edit_carburante_var = tk.StringVar()
        edit_carburante_combo = ttk.Combobox(scrollable_frame, textvariable=self.edit_carburante_var, width=28)
        edit_carburante_combo['values'] = (
            "Benzina", "Diesel", "GPL", "Mild Hybrid Benzina+Elettrico leggero",
            "Full Hybrid (HEV) Benzina+Elettrico", "Plug-in Hybrid (PHEV) Benzina+Elettrico con batteria grande",
            "Plug-in Hybrid (PHEV) Gasolio+Elettrico con batteria grande", "Benzina-GPL",
            "Benzina-Elettrico-GPL", "Elettrica", "Ibrida"
        )
        edit_carburante_combo.grid(row=row, column=1, sticky='ew', padx=5, pady=5)
        row += 1
        
        # Dropdown per tipo cambio
        ttk.Label(scrollable_frame, text="Tipo Cambio:").grid(row=row, column=0, sticky='w', padx=5, pady=5)
        self.edit_cambio_var = tk.StringVar()
        edit_cambio_combo = ttk.Combobox(scrollable_frame, textvariable=self.edit_cambio_var, width=28)
        edit_cambio_combo['values'] = ("Manuale", "Automatico")
        edit_cambio_combo.grid(row=row, column=1, sticky='ew', padx=5, pady=5)
        row += 1
        
        # Dropdown per euro
        ttk.Label(scrollable_frame, text="Euro:").grid(row=row, column=0, sticky='w', padx=5, pady=5)
        self.edit_euro_var = tk.StringVar()
        edit_euro_combo = ttk.Combobox(scrollable_frame, textvariable=self.edit_euro_var, width=28)
        edit_euro_combo['values'] = ("Euro 0", "Euro 1", "Euro 2", "Euro 3", "Euro 4", "Euro 5", "Euro 6", "Euro 6A", "Euro 6B", "Euro 6C", "Euro 6D", "Euro 7")
        edit_euro_combo.grid(row=row, column=1, sticky='ew', padx=5, pady=5)
        row += 1
        
        # Dropdown per neopatentati
        ttk.Label(scrollable_frame, text="Neopatentati:").grid(row=row, column=0, sticky='w', padx=5, pady=5)
        self.edit_neopatentati_var = tk.StringVar()
        edit_neopatentati_combo = ttk.Combobox(scrollable_frame, textvariable=self.edit_neopatentati_var, width=28)
        edit_neopatentati_combo['values'] = ("SI", "NO")
        edit_neopatentati_combo.grid(row=row, column=1, sticky='ew', padx=5, pady=5)
        row += 1
        
        # Checkbox per venduto
        self.edit_venduto_var = tk.BooleanVar()
        ttk.Checkbutton(scrollable_frame, text="Venduto", variable=self.edit_venduto_var).grid(row=row, column=0, columnspan=2, sticky='w', padx=5, pady=5)
        row += 1
        
        # Checkbox per aggiunto
        self.edit_aggiunto_var = tk.BooleanVar()
        ttk.Checkbutton(scrollable_frame, text="Aggiunto", variable=self.edit_aggiunto_var).grid(row=row, column=0, columnspan=2, sticky='w', padx=5, pady=5)
        row += 1
        
        # Sezione Gestione Immagini
        ttk.Label(scrollable_frame, text="Gestione Immagini:", font=('Arial', 10, 'bold')).grid(row=row, column=0, columnspan=3, sticky='w', padx=5, pady=(15, 5))
        row += 1
        
        # Lista immagini esistenti
        ttk.Label(scrollable_frame, text="Immagini Attuali:").grid(row=row, column=0, sticky='nw', padx=5, pady=5)
        
        # Frame per lista immagini con scrollbar
        images_frame = ttk.Frame(scrollable_frame)
        images_frame.grid(row=row, column=1, columnspan=2, sticky='ew', padx=5, pady=5)
        
        images_scrollbar = ttk.Scrollbar(images_frame)
        images_scrollbar.pack(side='right', fill='y')
        
        self.edit_images_listbox = tk.Listbox(images_frame, height=5, yscrollcommand=images_scrollbar.set)
        self.edit_images_listbox.pack(side='left', fill='both', expand=True)
        images_scrollbar.config(command=self.edit_images_listbox.yview)
        row += 1
        
        # Bottoni gestione immagini
        buttons_frame = ttk.Frame(scrollable_frame)
        buttons_frame.grid(row=row, column=1, columnspan=2, sticky='w', padx=5, pady=5)
        
        ttk.Button(buttons_frame, text="Aggiungi Immagini", command=self.add_images_to_edit).pack(side='left', padx=2)
        ttk.Button(buttons_frame, text="Rimuovi Selezionata", command=self.remove_image_from_edit).pack(side='left', padx=2)
        ttk.Button(buttons_frame, text="Imposta come Principale", command=self.set_main_image_edit).pack(side='left', padx=2)
        row += 1
        
        # Note
        ttk.Label(scrollable_frame, text="Nota: La prima immagine è quella principale", font=('Arial', 8, 'italic'), foreground='gray').grid(row=row, column=1, columnspan=2, sticky='w', padx=5, pady=2)
        row += 1
        
        # Bottone salva modifiche
        ttk.Button(scrollable_frame, text="Salva Modifiche", command=self.save_car_edit, style='Accent.TButton').grid(row=row, column=0, columnspan=3, pady=20)
        
        canvas.pack(side="left", fill="both", expand=True)
        scrollbar_right.pack(side="right", fill="y")
        
        # Variabile per tenere traccia dell'auto in modifica
        self.current_edit_car = None
        self.current_edit_brand = None
        self.edit_new_images = []  # Nuove immagini da aggiungere
    
    def populate_cars_for_edit(self):
        """Popola la lista con tutte le auto disponibili"""
        self.edit_cars_listbox.delete(0, tk.END)
        for brand in self.data['brands']:
            for car in brand['cars']:
                display_text = f"{brand['name']} - {car['name']} ({car['anno']}) - {car['chilometraggio']}km - €{car['prezzo']}"
                self.edit_cars_listbox.insert(tk.END, display_text)
    
    def refresh_edit_list(self):
        """Ricarica i dati dal JSON e aggiorna la lista"""
        self.data = self.load_json()
        self.edit_search_var.set("")  # Reset ricerca
        self.populate_cars_for_edit()
        messagebox.showinfo("Aggiornato", "Lista aggiornata con successo!")
    
    def filter_cars_for_edit(self, event):
        """Filtra le auto in base al testo di ricerca"""
        search_term = self.edit_search_var.get().lower()
        self.edit_cars_listbox.delete(0, tk.END)
        
        for brand in self.data['brands']:
            for car in brand['cars']:
                # Cerca in brand, nome, anno, prezzo
                searchable_text = f"{brand['name']} {car['name']} {car.get('sub_name', '')} {car['anno']} {car['prezzo']}".lower()
                if search_term in searchable_text:
                    display_text = f"{brand['name']} - {car['name']} ({car['anno']}) - {car['chilometraggio']}km - €{car['prezzo']}"
                    self.edit_cars_listbox.insert(tk.END, display_text)
    
    def load_car_for_edit(self, event):
        """Carica i dati dell'auto selezionata nel form di modifica"""
        selection = self.edit_cars_listbox.curselection()
        if not selection:
            return
        
        # Trova l'auto selezionata
        selected_index = 0
        search_term = self.edit_search_var.get().lower()
        
        for brand in self.data['brands']:
            for car in brand['cars']:
                # Se c'è un filtro attivo, salta le auto non corrispondenti
                if search_term:
                    searchable_text = f"{brand['name']} {car['name']} {car.get('sub_name', '')} {car['anno']} {car['prezzo']}".lower()
                    if search_term not in searchable_text:
                        continue
                
                if selected_index == selection[0]:
                    # Auto trovata!
                    self.current_edit_car = car
                    self.current_edit_brand = brand
                    self.edit_new_images = []
                    
                    # Popola il form
                    self.edit_entries['edit_name'].delete(0, tk.END)
                    self.edit_entries['edit_name'].insert(0, car['name'])
                    
                    self.edit_entries['edit_sub_name'].delete(0, tk.END)
                    self.edit_entries['edit_sub_name'].insert(0, car.get('sub_name', ''))
                    
                    self.edit_entries['edit_details'].delete(0, tk.END)
                    self.edit_entries['edit_details'].insert(0, car.get('details', ''))
                    
                    self.edit_entries['edit_chilometraggio'].delete(0, tk.END)
                    self.edit_entries['edit_chilometraggio'].insert(0, str(car['chilometraggio']))
                    
                    self.edit_entries['edit_anno'].delete(0, tk.END)
                    self.edit_entries['edit_anno'].insert(0, str(car['anno']))
                    
                    self.edit_entries['edit_cilindrata'].delete(0, tk.END)
                    self.edit_entries['edit_cilindrata'].insert(0, str(car['cilindrata']))
                    
                    self.edit_entries['edit_cavalli'].delete(0, tk.END)
                    self.edit_entries['edit_cavalli'].insert(0, str(car['cavalli']))
                    
                    self.edit_entries['edit_kw'].delete(0, tk.END)
                    self.edit_entries['edit_kw'].insert(0, str(car['kw']))
                    
                    self.edit_entries['edit_posti'].delete(0, tk.END)
                    self.edit_entries['edit_posti'].insert(0, str(car['posti']))
                    
                    self.edit_entries['edit_prezzo'].delete(0, tk.END)
                    self.edit_entries['edit_prezzo'].insert(0, str(car['prezzo']))
                    
                    # Dropdowns
                    self.edit_condizioni_var.set(car.get('condizioni', ''))
                    self.edit_carburante_var.set(car.get('carburante', ''))
                    self.edit_cambio_var.set(car.get('tipo_cambio', ''))
                    self.edit_euro_var.set(car.get('euro', ''))
                    self.edit_neopatentati_var.set(car.get('neopatentati', ''))
                    
                    # Checkboxes
                    self.edit_venduto_var.set(car.get('venduto', False))
                    self.edit_aggiunto_var.set(car.get('aggiunto', False))
                    
                    # Popola lista immagini
                    self.edit_images_listbox.delete(0, tk.END)
                    if 'gallery' in car and car['gallery']:
                        for i, img_path in enumerate(car['gallery']):
                            img_name = img_path.split('/')[-1]
                            prefix = "[PRINCIPALE] " if i == 0 else ""
                            self.edit_images_listbox.insert(tk.END, f"{prefix}{img_name}")
                    
                    return
                
                selected_index += 1
    
    def add_images_to_edit(self):
        """Aggiunge nuove immagini all'auto in modifica"""
        if not self.current_edit_car:
            messagebox.showwarning("Attenzione", "Seleziona prima un'auto da modificare!")
            return
        
        file_paths = filedialog.askopenfilenames(
            title="Seleziona immagini da aggiungere",
            filetypes=[("Immagini", "*.jpg *.jpeg *.png *.gif *.webp")]
        )
        
        if file_paths:
            for path in file_paths:
                self.edit_new_images.append(path)
                img_name = os.path.basename(path)
                self.edit_images_listbox.insert(tk.END, f"[NUOVA] {img_name}")
    
    def remove_image_from_edit(self):
        """Rimuove un'immagine selezionata"""
        if not self.current_edit_car:
            messagebox.showwarning("Attenzione", "Seleziona prima un'auto da modificare!")
            return
        
        selection = self.edit_images_listbox.curselection()
        if not selection:
            messagebox.showwarning("Attenzione", "Seleziona un'immagine da rimuovere!")
            return
        
        index = selection[0]
        
        # Se è la prima immagine (principale), chiedi conferma
        if index == 0:
            if not messagebox.askyesno("Conferma", "Stai per rimuovere l'immagine principale. Continuare?"):
                return
        
        # Rimuovi dalla lista
        self.edit_images_listbox.delete(index)
        
        # Aggiorna le gallerie
        gallery_size = len(self.current_edit_car.get('gallery', []))
        
        if index < gallery_size:
            # Immagine esistente - rimuovi dalla gallery dell'auto
            self.current_edit_car['gallery'].pop(index)
        else:
            # Nuova immagine non ancora salvata
            new_image_index = index - gallery_size
            if new_image_index < len(self.edit_new_images):
                self.edit_new_images.pop(new_image_index)
    
    def set_main_image_edit(self):
        """Imposta l'immagine selezionata come principale (la sposta in prima posizione)"""
        if not self.current_edit_car:
            messagebox.showwarning("Attenzione", "Seleziona prima un'auto da modificare!")
            return
        
        selection = self.edit_images_listbox.curselection()
        if not selection:
            messagebox.showwarning("Attenzione", "Seleziona un'immagine da impostare come principale!")
            return
        
        index = selection[0]
        
        if index == 0:
            messagebox.showinfo("Info", "Questa immagine è già quella principale!")
            return
        
        # Sposta l'immagine in prima posizione
        gallery_size = len(self.current_edit_car.get('gallery', []))
        
        if index < gallery_size:
            # Immagine esistente
            gallery = self.current_edit_car['gallery']
            selected_img = gallery.pop(index)
            gallery.insert(0, selected_img)
        else:
            # Nuova immagine
            new_image_index = index - gallery_size
            if new_image_index < len(self.edit_new_images):
                selected_img = self.edit_new_images.pop(new_image_index)
                self.edit_new_images.insert(0, selected_img)
        
        # Aggiorna la visualizzazione
        self.edit_images_listbox.delete(0, tk.END)
        
        # Mostra immagini esistenti
        if 'gallery' in self.current_edit_car and self.current_edit_car['gallery']:
            for i, img_path in enumerate(self.current_edit_car['gallery']):
                img_name = img_path.split('/')[-1]
                prefix = "[PRINCIPALE] " if i == 0 else ""
                self.edit_images_listbox.insert(tk.END, f"{prefix}{img_name}")
        
        # Mostra nuove immagini
        for img_path in self.edit_new_images:
            img_name = os.path.basename(img_path)
            self.edit_images_listbox.insert(tk.END, f"[NUOVA] {img_name}")
    
    def save_car_edit(self):
        """Salva le modifiche all'auto"""
        if not self.current_edit_car or not self.current_edit_brand:
            messagebox.showwarning("Attenzione", "Seleziona prima un'auto da modificare!")
            return
        
        try:
            # Aggiorna dati con formattazione
            self.current_edit_car['name'] = self.edit_entries['edit_name'].get().title()  # Ogni parola con maiuscola
            self.current_edit_car['sub_name'] = self.edit_entries['edit_sub_name'].get().capitalize()  # Prima lettera maiuscola
            self.current_edit_car['details'] = self.edit_entries['edit_details'].get().capitalize()  # Prima lettera maiuscola
            self.current_edit_car['chilometraggio'] = int(self.edit_entries['edit_chilometraggio'].get())
            self.current_edit_car['anno'] = int(self.edit_entries['edit_anno'].get())
            self.current_edit_car['cilindrata'] = int(self.edit_entries['edit_cilindrata'].get())
            self.current_edit_car['cavalli'] = int(self.edit_entries['edit_cavalli'].get())
            self.current_edit_car['kw'] = int(self.edit_entries['edit_kw'].get())
            self.current_edit_car['posti'] = int(self.edit_entries['edit_posti'].get())
            self.current_edit_car['prezzo'] = float(self.edit_entries['edit_prezzo'].get())
            self.current_edit_car['condizioni'] = self.edit_condizioni_var.get()
            self.current_edit_car['carburante'] = self.edit_carburante_var.get()
            self.current_edit_car['tipo_cambio'] = self.edit_cambio_var.get()
            self.current_edit_car['euro'] = self.edit_euro_var.get()
            self.current_edit_car['neopatentati'] = self.edit_neopatentati_var.get()
            self.current_edit_car['venduto'] = self.edit_venduto_var.get()
            self.current_edit_car['aggiunto'] = self.edit_aggiunto_var.get()
            
            # Gestione nuove immagini
            if self.edit_new_images:
                # Ottieni la cartella delle immagini dall'immagine esistente
                if 'image' in self.current_edit_car and self.current_edit_car['image']:
                    # Estrae il percorso della cartella
                    image_parts = self.current_edit_car['image'].split('/')
                    if len(image_parts) >= 4:
                        brand_id = image_parts[2]
                        folder_name = image_parts[3]
                        relative_base = f"../cars/{brand_id}/{folder_name}"
                        
                        script_dir = Path(__file__).parent
                        cars_base_path = script_dir.parent / "cars"
                        folder_path = cars_base_path / brand_id / folder_name
                        
                        # Trova il prossimo indice disponibile per le immagini
                        existing_count = len(self.current_edit_car.get('gallery', []))
                        
                        # Copia e ottimizza nuove immagini
                        for i, img_path in enumerate(self.edit_new_images):
                            img_ext = os.path.splitext(img_path)[1]
                            img_dest = folder_path / f"main{existing_count + i}{img_ext}"
                            shutil.copy2(img_path, str(img_dest))
                            
                            # Ottimizza immagine
                            optimized_path = self.optimize_image(str(img_dest))
                            optimized_ext = os.path.splitext(optimized_path)[1]
                            
                            # Aggiungi alla gallery
                            if 'gallery' not in self.current_edit_car:
                                self.current_edit_car['gallery'] = []
                            self.current_edit_car['gallery'].append(f"{relative_base}/main{existing_count + i}{optimized_ext}")
            
            # Aggiorna l'immagine principale (prima della gallery)
            if 'gallery' in self.current_edit_car and self.current_edit_car['gallery']:
                self.current_edit_car['image'] = self.current_edit_car['gallery'][0]
            
            # Salva JSON
            self.save_json()
            
            # Aggiorna lista
            self.populate_cars_for_edit()
            
            messagebox.showinfo("Successo", "Auto modificata con successo!")
            
        except Exception as e:
            messagebox.showerror("Errore", f"Errore durante il salvataggio: {str(e)}")
    
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
            filetypes=[("Immagini", "*.jpg *.jpeg *.png *.gif *.webp")]
        )
        if file_path:
            if img_type == 'main':
                self.main_image_path.set(file_path)
    
    def select_gallery_images(self):
        file_paths = filedialog.askopenfilenames(
            title="Seleziona immagini per la galleria",
            filetypes=[("Immagini", "*.jpg *.jpeg *.png *.gif *.webp")]
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
    
    def optimize_image(self, image_path, target_size=(1200, 800), quality=85):
        """
        Ottimizza l'immagine:
        1. Ritaglia al rapporto 3:2 (centratura)
        2. Ridimensiona a 1200x800
        3. Comprime con qualità 85%
        
        Args:
            image_path: percorso dell'immagine originale
            target_size: dimensione target (width, height) - default 1200x800
            quality: qualità JPEG (1-100) - default 85
        
        Returns:
            Path dell'immagine ottimizzata (stesso percorso, sovrascrive l'originale)
        """
        try:
            # Apri immagine
            img = Image.open(image_path)
            
            # Converti in RGB se necessario (per PNG con trasparenza)
            if img.mode in ('RGBA', 'LA', 'P'):
                # Crea sfondo bianco
                background = Image.new('RGB', img.size, (255, 255, 255))
                if img.mode == 'P':
                    img = img.convert('RGBA')
                background.paste(img, mask=img.split()[-1] if img.mode == 'RGBA' else None)
                img = background
            elif img.mode != 'RGB':
                img = img.convert('RGB')
            
            # Dimensioni originali
            original_width, original_height = img.size
            target_width, target_height = target_size
            
            # Rapporto target (3:2 = 1.5)
            target_ratio = target_width / target_height
            original_ratio = original_width / original_height
            
            # Ritaglia al centro per rispettare il rapporto 3:2
            if original_ratio > target_ratio:
                # Immagine troppo larga - ritaglia ai lati
                new_width = int(original_height * target_ratio)
                left = (original_width - new_width) // 2
                img = img.crop((left, 0, left + new_width, original_height))
            elif original_ratio < target_ratio:
                # Immagine troppo alta - ritaglia sopra/sotto
                new_height = int(original_width / target_ratio)
                top = (original_height - new_height) // 2
                img = img.crop((0, top, original_width, top + new_height))
            
            # Ridimensiona a 1200x800
            img = img.resize(target_size, Image.Resampling.LANCZOS)
            
            # Salva con compressione ottimizzata
            # Determina formato in base all'estensione
            ext = os.path.splitext(image_path)[1].lower()
            if ext in ['.jpg', '.jpeg']:
                img.save(image_path, 'JPEG', quality=quality, optimize=True)
            elif ext == '.png':
                img.save(image_path, 'PNG', optimize=True)
            else:
                # Default a JPEG
                new_path = os.path.splitext(image_path)[0] + '.jpg'
                img.save(new_path, 'JPEG', quality=quality, optimize=True)
                if new_path != image_path:
                    os.remove(image_path)
                    return new_path
            
            return image_path
            
        except Exception as e:
            print(f"Errore nell'ottimizzazione di {image_path}: {str(e)}")
            return image_path  # Ritorna percorso originale in caso di errore
    
    
    def add_car(self):
        try:
            # Valida selezione brand
            selection = self.brand_listbox.curselection()
            if not selection:
                messagebox.showerror("Errore", "Seleziona un brand!")
                return
            
            brand_name = self.brand_listbox.get(selection[0])
            brand = next((b for b in self.data['brands'] if b['name'] == brand_name), None)
            
            # Raccogli dati con formattazione
            car_data = {
                "brand": brand['name'],
                "name": self.entries['name'].get().title(),  # Ogni parola con maiuscola
                "sub_name": self.entries['sub_name'].get().capitalize(),  # Prima lettera maiuscola
                "details": self.entries['details'].get().capitalize(),  # Prima lettera maiuscola
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
            
            # Gestione limite 6 auto con aggiunto=true
            if car_data['aggiunto']:
                # Cerca tutte le auto con aggiunto=true in tutti i brand
                added_cars = []
                for b in self.data['brands']:
                    for car in b['cars']:
                        if car.get('aggiunto', False):
                            added_cars.append({
                                'car': car,
                                'brand': b,
                                'date_added': car.get('date_added', '01-01-1970 00:00:00')
                            })
                
                # Se ci sono già 6 o più auto con aggiunto=true
                if len(added_cars) >= 6:
                    # Ordina per data (dal più recente al più vecchio)
                    added_cars.sort(key=lambda x: datetime.strptime(x['date_added'], "%d-%m-%Y %H:%M:%S"), reverse=True)
                    
                    # Rimuovi aggiunto=true dalla più vecchia (ultima nella lista ordinata)
                    oldest = added_cars[-1]
                    oldest['car']['aggiunto'] = False
                    messagebox.showinfo("Info", f"Rimosso flag 'aggiunto' dall'auto più vecchia: {oldest['car']['name']} ({oldest['car']['anno']}) - Aggiunta il: {oldest['date_added']}")
            
            # Genera ID
            car_id = self.generate_car_id(
                brand['id'], 
                car_data['name'], 
                car_data['chilometraggio'], 
                car_data['anno']
            )
            car_data['id'] = car_id
            
            # Aggiungi data e ora corrente
            now = datetime.now()
            car_data['date_added'] = now.strftime("%d-%m-%Y %H:%M:%S")
            
            # Crea cartella e copia immagini
            id_completo = car_id.split('-')[1]  # Estrae XXXidNumerico (senza il brand_id)
            script_dir = Path(__file__).parent
            cars_base_path = script_dir.parent / "cars"  # g:\YaraAuto_website\yaraauto-website\cars
            folder_name = f"{car_data['name'].lower().replace(' ', '')}-{id_completo}"
            folder_path = cars_base_path / brand['id'] / folder_name
            folder_path.mkdir(parents=True, exist_ok=True)
            
            # Percorso relativo base per il JSON (relativo alla root del sito)
            relative_base = f"../cars/{brand['id']}/{folder_name}"
            
            # Copia e ottimizza immagine principale
            if self.main_image_path.get():
                main_img_ext = os.path.splitext(self.main_image_path.get())[1]
                main_img_dest = folder_path / f"main{main_img_ext}"
                shutil.copy2(self.main_image_path.get(), str(main_img_dest))
                
                # Ottimizza immagine a 1200x800
                optimized_path = self.optimize_image(str(main_img_dest))
                optimized_ext = os.path.splitext(optimized_path)[1]
                
                # Salva percorso relativo nel JSON
                car_data['image'] = f"{relative_base}/main{optimized_ext}"
            
            # Copia e ottimizza galleria
            gallery = []
            if self.main_image_path.get():
                optimized_ext = os.path.splitext(car_data['image'].split('/')[-1])[1]
                gallery.append(f"{relative_base}/main{optimized_ext}")
            
            for i, img_path in enumerate(self.gallery_paths[1:] if self.main_image_path.get() in self.gallery_paths else self.gallery_paths, 1):
                img_ext = os.path.splitext(img_path)[1]
                img_dest = folder_path / f"main{i}{img_ext}"
                shutil.copy2(img_path, str(img_dest))
                
                # Ottimizza immagine a 1200x800
                optimized_path = self.optimize_image(str(img_dest))
                optimized_ext = os.path.splitext(optimized_path)[1]
                
                # Salva percorso relativo nel JSON
                gallery.append(f"{relative_base}/main{i}{optimized_ext}")
            
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
    
    def populate_cars_for_removal(self):
        """Popola la lista con tutte le auto disponibili per la rimozione"""
        self.cars_listbox.delete(0, tk.END)
        for brand in self.data['brands']:
            for car in brand['cars']:
                display_text = f"{brand['name']} - {car['name']} ({car['anno']}) - {car['chilometraggio']}km - €{car['prezzo']}"
                self.cars_listbox.insert(tk.END, display_text)
    
    def refresh_remove_list(self):
        """Ricarica i dati dal JSON e aggiorna la lista"""
        self.data = self.load_json()
        self.remove_search_var.set("")  # Reset ricerca
        self.populate_cars_for_removal()
        messagebox.showinfo("Aggiornato", "Lista aggiornata con successo!")
    
    def filter_cars_for_removal(self, event):
        """Filtra le auto in base al testo di ricerca"""
        search_term = self.remove_search_var.get().lower()
        self.cars_listbox.delete(0, tk.END)
        
        for brand in self.data['brands']:
            for car in brand['cars']:
                # Cerca in brand, nome, sub_name, anno, prezzo
                searchable_text = f"{brand['name']} {car['name']} {car.get('sub_name', '')} {car['anno']} {car['prezzo']}".lower()
                if search_term in searchable_text:
                    display_text = f"{brand['name']} - {car['name']} ({car['anno']}) - {car['chilometraggio']}km - €{car['prezzo']}"
                    self.cars_listbox.insert(tk.END, display_text)
    
    def load_cars_for_removal(self, event):
        """Funzione legacy - non più utilizzata con la ricerca"""
        pass
    
    def remove_car(self):
        selection = self.cars_listbox.curselection()
        if not selection:
            messagebox.showerror("Errore", "Seleziona un'auto da rimuovere!")
            return
        
        # Trova l'auto selezionata nella lista filtrata
        selected_index = 0
        search_term = self.remove_search_var.get().lower()
        
        target_brand = None
        target_car = None
        target_car_index = None
        
        for brand in self.data['brands']:
            for car_idx, car in enumerate(brand['cars']):
                # Se c'è un filtro attivo, salta le auto non corrispondenti
                if search_term:
                    searchable_text = f"{brand['name']} {car['name']} {car.get('sub_name', '')} {car['anno']} {car['prezzo']}".lower()
                    if search_term not in searchable_text:
                        continue
                
                if selected_index == selection[0]:
                    # Auto trovata!
                    target_brand = brand
                    target_car = car
                    target_car_index = car_idx
                    break
                
                selected_index += 1
            
            if target_car:
                break
        
        if not target_car or not target_brand:
            messagebox.showerror("Errore", "Auto non trovata!")
            return
        
        # Conferma
        if messagebox.askyesno("Conferma", f"Vuoi rimuovere {target_car['name']} ({target_car['anno']}) - {target_brand['name']}?"):
            # Rimuovi cartella immagini se il flag è attivo
            if self.DELETE_IMAGE_FOLDERS and 'image' in target_car and target_car['image']:
                try:
                    # Estrae il percorso della cartella dall'immagine
                    # car['image'] è tipo: "../cars/fiat/fiatpanda-ftp201812/main.jpg"
                    script_dir = Path(__file__).parent
                    cars_base_path = script_dir.parent / "cars"
                    
                    # Estrae brand_id e folder_name dal percorso
                    image_parts = target_car['image'].split('/')
                    if len(image_parts) >= 4:  # ../cars/brand_id/folder_name/image
                        brand_id = image_parts[2]
                        folder_name = image_parts[3]
                        folder_path = cars_base_path / brand_id / folder_name
                        
                        if folder_path.exists():
                            shutil.rmtree(folder_path)
                            print(f"Cartella eliminata: {folder_path}")
                except Exception as e:
                    messagebox.showwarning("Avviso", f"Errore nell'eliminazione della cartella: {str(e)}")
            
            target_brand['cars'].pop(target_car_index)
            self.save_json()
            
            # Aggiorna la lista
            if search_term:
                self.filter_cars_for_removal(None)
            else:
                self.populate_cars_for_removal()
            
            messagebox.showinfo("Successo", "Auto rimossa con successo!")

if __name__ == "__main__":
    root = tk.Tk()
    app = CarManagerApp(root)
    root.mainloop()