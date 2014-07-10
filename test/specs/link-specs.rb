require_relative '../../rake_lib/helper.rb'

describe "gihub links" do

  data = """
  Maître Corbeau, sur un arbre perché,
  [Phonegap](http://phonegap.com/)
  Tenait en son bec un fromage.
  [platform support doc 1](/docs/en/appium-setup/platform-support1.md)
  Maître Renard, par l'odeur alléché,
  [platform support doc 2](docs/en/appium-setup/platform-support2.md)
  Lui tint à peu près ce langage :
  [capabilities doc](/docs/en/writing-running-appium/caps.md)
  Et bonjour, Monsieur du Corbeau,
  À ces mots le Corbeau ne se sent pas de joie, 
  [capabilities doc](/docs/en/writing-running-appium/caps.md)
  Et pour montrer sa belle voix,
  [main doc 1](/docs/en/)
  Il ouvre un large bec, laisse tomber sa proie.
  [main doc 2](docs/en/)
  """

  it "should rewrite the link with /.*/ prefix" do
    
    res = AppiumIo::Helper.rewrite_github_links data, prefix=/.*/

    expect(res).to include('[Phonegap](http://phonegap.com/)')
    expect(res).to include('[platform support doc 1](/slate/en/master/#platform-support1.md)')
    expect(res).to include('[platform support doc 2](/slate/en/master/#platform-support2.md)')
    expect(res).to include('[capabilities doc](/slate/en/master/#caps.md)')  
    expect(res).to include('[main doc 1](/documentation.html?lang=en)')  
    expect(res).to include('[main doc 2](/documentation.html?lang=en)')  
      
    expect(res).not_to include('/platform-support1.md')
    expect(res).not_to include('/platform-support2.md')
    expect(res).not_to include('/caps.md')
    expect(res).not_to include('docs/en/)')
    
    
  end

  # it "should rewrite the link with default prefix" do
    
  #   res = AppiumIo::Helper.rewrite_github_links data

  #   expect(res).to include('[Phonegap](http://phonegap.com/)')
  #   expect(res).to include('[platform support doc 1](/slate/en/master/#platform-support1.md)')
  #   expect(res).to include('[platform support doc 2](/slate/en/master/#platform-support2.md)')
  #   expect(res).to include('[capabilities doc](/slate/en/master/#caps.md)')  
  
  #   expect(res).not_to include('/platform-support1.md')
  #   expect(res).not_to include('/platform-support2.md')
  #   expect(res).not_to include('/caps.md')
  # end

end