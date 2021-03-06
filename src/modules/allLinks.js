allLinks=function(name,listSel,listName){
    this.name=name;
    this.listSel=listSel;
    this.listName=listName;
    this.dlgID='izh-dlg-'+name;
    this.$dlg=null;
    //初始化弹出框
    this.initDialog = function(){
      this.$dlg=$('#'+this.dlgID);
      var retVal=0<this.$dlg.length;
      if(!retVal){
        var dom = [
          '<div id="'+this.dlgID+'" class="modal-dialog allLinks" tabindex="0" style="display: none;width:500px">',
            '<div class="modal-dialog-title modal-dialog-title-draggable">',
              '<span class="modal-dialog-title-text">'+this.listName+'链接清单</span>',
              '<span class="modal-dialog-title-text izhihu-collection-info"></span>',
              '<span class="modal-dialog-title-close"></span>',
            '</div>',
            '<div class="modal-dialog-content">',
              '<div>',
                '<div class="zg-section">',
                  '<div class="izhihu-collection-links" tabIndex="-1" class="zg-form-text-input" style="height:300px;overflow-y:scroll;outline:none;">',
                  '</div>',
                  '<form action="http://ilovezhihu.duapp.com/saveMe.py"method="post"target="_blank"style="display:none"><textarea style="width: 100%;" name="links"class="izhihu-collection-links-post"></textarea><input name="title"/></form>',
                '</div>',
                '<div class="zm-command">',
                  '<div class="zg-left">',
                  '<a class="zg-btn-blue reload" href="javascript:;">重新获取</a>',
                  '</div>',
                  //'<a class="zm-command-cancel" name="cancel" href="javascript:;">取消</a>',
                  '<a class="zg-btn-blue save" href="javascript:;">保存</a>',
                '</div>',
              '</div>',
            '</div>',
          '</div>'
        ].join('');
        
        this.$dlg = $(dom).appendTo(document.body).attr('name',this.name).attr('listSel',this.listSel);
        if(this.$dlg.length)
            retVal=true;

        $('.modal-dialog-title-close',this.$dlg).click(function(){
          $('#zh-global-spinner').hide();
          $('.modal-dialog-bg').hide();
          $(this).parentsUntil('.modal-dialog').parent().hide();
        });

        //拖动
        this.$dlg.drags({handler:'.modal-dialog-title-draggable'});
        
        $('.save',this.$dlg).click(function(){
            var $dlg=$(this).parentsUntil('.modal-dialog-content').parent()
              , $links=$dlg.find('.izhihu-collection-links')
              , $linksPost=$dlg.find('.izhihu-collection-links-post')
              , $linksTitle=$linksPost.next()
              , $form=$linksPost.parent()
              , links=''
            ;
            $links.find('li a').each(function(i,e){
                links+=e.getAttribute('href')+'\n';
            });
            $linksPost.val(links);
            $linksTitle.val($('#zh-fav-head-title,.zm-profile-header-username').text());
            $form.submit();
        });
        
        $('.reload',this.$dlg).click(function(){
            var $d=$(this).parentsUntil('.modal-dialog').parent();
            result=[];
            next = '0';
            $('.izhihu-collection-links',$d).empty();
            var listSel=$d.attr('listSel');
            msg=[$('.zm-item',listSel).size(), $(listSel).html(),'0'];
            handler(msg,$d);
        });
      }
      return retVal;
    };
    this.start=function($d){
        if(!$d)$d=this.$dlg;
        if(!$d)return;
        if($('#zh-global-spinner:visible').length)return;
        $('#zh-global-spinner').show();
        var msg=[0,'','0'];
        if(!$('.izhihu-collection-links',$d).children().length
            || next==''){
            result=[];
            next = '0';
            $('.izhihu-collection-links',$d).empty();
            var listSel=$d.attr('listSel');
            msg=[$('.zm-item',listSel).size(), $(listSel).html(),'0'];
        }
        handler(msg,$d);
    };
};

//分析内容
var processNode = function(content,$dlg){
  $(content).find('.zm-item-answer').each(function(index, item){
    var dom = $(item)
      , parent = dom.parent()
      , lnkTitle = $("a", dom.closest(".zm-item").children().first())
      , hrefQuestion = url.data.attr["base"] + lnkTitle.attr("href").replace(url.data.attr["base"],'')
    ;//console.log(dom);
    var obj = {
        title: lnkTitle.text(),
        questionUrl: hrefQuestion,
        answerUrl: hrefQuestion + (dom.parent().is(".zm-item-fav") ? "/answer/" + dom.attr("data-atoken") : ""),
        answerAuthor: dom.find('.zm-item-answer-author-wrap a[href^="/people"]').text().trim(),
        summary: dom.find(".zm-item-answer-summary").children().remove().end().text(),
        content: dom.find(".zm-editable-content").html()
    };
    result.push(obj);
    var str = utils.formatStr('<li style="list-style-type:none"><a href="{answerUrl}" title="* 《{title}》&#13;* {answerAuthor}：&#13;* {summary}">{answerUrl}</a></li>', obj);
    $('.izhihu-collection-links',$dlg).append(str);
    var count=result.length;
    $('.izhihu-collection-info',$dlg).html('（努力加载中...已得到记录 ' + count + ' 条）');
  });
};
    
//处理函数
var handlerCollections=function(msg,$dlg){
    next=String(msg[2]);
    if(next=='0')
        next=$('#zh-load-more').attr('data-next');
    $.post(window.location, $.param({
        offset: 0
      , start: next
      , _xsrf: $('input[name=_xsrf]').val()
    }),function(r){
      handler(r.msg,$('.modal-dialog.allLinks'));
    });
};
var handlerAnswers=function(msg,$dlg){
    var c=Number(msg[0]);
    if(!c){
        next='-1';
        handler([0,'','-1'],$dlg);
        return;
    }
    next = String(Number(next)+c);
    eval('var param='+$('#zh-profile-answer-list').children().first().attr('data-init'));
    if(param&&param.params){
    	$.extend(param.params,{offset:Number(next)});
        var s=url.data.attr.base+'/node/'+param.nodename;
        $.post(s, $.param({
            method:'next'
          , params:JSON.stringify(param.params)
          , _xsrf: $('input[name=_xsrf]').val()
        }),function(r){
          handler([r.msg.length,r.msg.join(''),r.msg.length?String(r.msg.length):'-1'],$('.modal-dialog.allLinks'));
        });
    }
};
var next = '';
var handler = function(msg,$dlg){
  processNode(msg[1],$dlg);

  if($dlg.is(':hidden')){
    $('#zh-global-spinner').hide();
    return;
  }
  
  if(next !== '-1'){
    var funcName='handler'+$dlg.attr('name')
      , param=null;
    eval('if('+funcName+'){'+funcName+'(msg,$dlg)}');
  }else{
    $('.izhihu-collection-info',$dlg).html('（加载完成，共得到记录 ' + result.length + ' 条）');
    $('#zh-global-spinner').hide();
    $('.selAll',$dlg).click();
  }
};
